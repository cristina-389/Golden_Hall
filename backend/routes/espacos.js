/* ==========================================================================
   GOLDEN HALL - ROTAS DE ESPAÇOS (CRUD)
   CRUD = Create, Read, Update, Delete (Criar, Ler, Atualizar, Apagar) - as
   4 operações básicas que praticamente todo "recurso" de uma API tem.

   Duas rotas são PÚBLICAS (listar e ver detalhes) - qualquer visitante
   pode ver os espaços, mesmo sem estar logado, porque é isso que alimenta
   as páginas de busca e detalhes do site.

   As outras (criar, editar, remover) são PROTEGIDAS: passam pelo
   middleware "autenticar" (confere se tem token válido) e "exigirDono"
   (confere se quem está logado é uma conta do tipo "dono").
   ========================================================================== */

const express = require('express');
const db = require('../database/db');
const { autenticar, exigirDono } = require('../middlewares/autenticacao');

const router = express.Router();

// Transforma um nome em slug: "Chácara Golden!" -> "chacara-golden".
// Usamos isso pra gerar o identificador amigável da URL automaticamente,
// sem o dono do espaço ter que digitar um "chacara-golden" na mão.
function gerarSlug(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // troca "á, ç, ã..." pelas letras sem acento
        .replace(/[^a-z0-9\s-]/g, '')                       // remove pontuação e símbolos
        .trim()
        .replace(/\s+/g, '-');                              // espaços viram hífen
}

// Igual gerarSlug, mas garante que o resultado ainda não existe no banco -
// se "chacara-golden" já estiver em uso, tenta "chacara-golden-2", depois
// "chacara-golden-3", e por aí vai, até achar um livre.
function gerarSlugUnico(nome) {
    const base = gerarSlug(nome);
    let slug = base;
    let contador = 2;

    while (db.prepare('SELECT id FROM espacos WHERE slug = ?').get(slug)) {
        slug = `${base}-${contador}`;
        contador++;
    }

    return slug;
}

// --------------------------------------------------------------------------
// GET /api/espacos - lista PÚBLICA de todos os espaços (usada na busca)
// --------------------------------------------------------------------------
router.get('/espacos', (req, res) => {
    const espacos = db.prepare('SELECT * FROM espacos ORDER BY criado_em DESC').all();
    res.json(espacos);
});

// --------------------------------------------------------------------------
// GET /api/espacos/:slug - detalhes PÚBLICOS de um espaço (página de detalhes)
// --------------------------------------------------------------------------
router.get('/espacos/:slug', (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE slug = ?').get(req.params.slug);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    res.json(espaco);
});

// --------------------------------------------------------------------------
// GET /api/meus-espacos - só os espaços do dono que está logado
// --------------------------------------------------------------------------
router.get('/meus-espacos', autenticar, exigirDono, (req, res) => {
    const espacos = db
        .prepare('SELECT * FROM espacos WHERE dono_id = ? ORDER BY criado_em DESC')
        .all(req.usuario.id);

    res.json(espacos);
});

// --------------------------------------------------------------------------
// GET /api/espacos/:id/reservas - lista as reservas recebidas NESTE espaço
// (o painel do dono usa isso pra mostrar quem quer reservar cada espaço dele)
// --------------------------------------------------------------------------
router.get('/espacos/:id/reservas', autenticar, exigirDono, (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    // Mesma checagem de autorização usada no PUT/DELETE: só o dono DESTE
    // espaço específico pode ver as reservas dele
    if (espaco.dono_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode ver reservas dos seus próprios espaços.' });
    }

    // JOIN com usuarios pra trazer o nome/telefone de quem fez cada reserva
    const reservas = db
        .prepare(`
            SELECT
                reservas.*,
                usuarios.nome AS cliente_nome,
                usuarios.email AS cliente_email
            FROM reservas
            JOIN usuarios ON usuarios.id = reservas.usuario_id
            WHERE reservas.espaco_id = ?
            ORDER BY reservas.data ASC
        `)
        .all(req.params.id);

    res.json(reservas);
});

// --------------------------------------------------------------------------
// POST /api/espacos - cria um espaço novo (só donos logados)
// --------------------------------------------------------------------------
router.post('/espacos', autenticar, exigirDono, (req, res) => {
    const { nome, descricao, local, capacidade, preco, imagem } = req.body;

    if (!nome) {
        return res.status(400).json({ erro: 'O espaço precisa de um nome.' });
    }

    const slug = gerarSlugUnico(nome);

    const resultado = db
        .prepare(`
            INSERT INTO espacos (dono_id, slug, nome, descricao, local, capacidade, preco, imagem)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
            req.usuario.id, // vem do token, não do que a pessoa mandou no body -
                             // assim ninguém consegue criar um espaço "em nome de outro dono"
            slug,
            nome,
            descricao || null,
            local || null,
            capacidade || null,
            preco || null,
            imagem || null
        );

    const novoEspaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(novoEspaco);
});

// --------------------------------------------------------------------------
// PUT /api/espacos/:id - edita um espaço (só o DONO DESSE espaço)
// --------------------------------------------------------------------------
router.put('/espacos/:id', autenticar, exigirDono, (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    // AUTENTICAÇÃO vs AUTORIZAÇÃO: "autenticar" só garante que a pessoa está
    // logada e é uma conta "dono" - mas não garante que é dona DESTE espaço
    // específico. Por isso essa checagem extra aqui: sem ela, qualquer dono
    // logado poderia editar o espaço de outro dono só sabendo o id.
    if (espaco.dono_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode editar espaços que são seus.' });
    }

    const { nome, descricao, local, capacidade, preco, imagem } = req.body;

    // "??" (nullish coalescing): se o campo não veio no pedido (undefined),
    // mantém o valor que já estava salvo, em vez de apagar com "null"
    db.prepare(`
        UPDATE espacos
        SET nome = ?, descricao = ?, local = ?, capacidade = ?, preco = ?, imagem = ?
        WHERE id = ?
    `).run(
        nome ?? espaco.nome,
        descricao ?? espaco.descricao,
        local ?? espaco.local,
        capacidade ?? espaco.capacidade,
        preco ?? espaco.preco,
        imagem ?? espaco.imagem,
        req.params.id
    );

    const espacoAtualizado = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);
    res.json(espacoAtualizado);
});

// --------------------------------------------------------------------------
// DELETE /api/espacos/:id - remove um espaço (só o DONO DESSE espaço)
// --------------------------------------------------------------------------
router.delete('/espacos/:id', autenticar, exigirDono, (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    if (espaco.dono_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode remover espaços que são seus.' });
    }

    db.prepare('DELETE FROM espacos WHERE id = ?').run(req.params.id);

    // 204 = "deu certo, mas não tem nada pra te devolver" (padrão pra delete)
    res.status(204).send();
});

module.exports = router;
