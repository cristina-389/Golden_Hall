/* ==========================================================================
   GOLDEN HALL - ROTAS DE ESPAÇOS (CRUD)
   CRUD = Create, Read, Update, Delete (Criar, Ler, Atualizar, Apagar) - as
   4 operações básicas que praticamente todo "recurso" de uma API tem.

   Duas rotas são PÚBLICAS (listar e ver detalhes) - qualquer visitante
   pode ver os espaços, mesmo sem estar logado, porque é isso que alimenta
   as páginas de busca e detalhes do site.

   As outras (criar, editar, remover) são PROTEGIDAS: passam pelo
   middleware "autenticar" (confere se tem token válido) e "exigirProprietario"
   (confere se quem está logado é uma conta do tipo "proprietario").
   ========================================================================== */

const express = require('express');
const db = require('../database/db');
const { autenticar, exigirProprietario } = require('../middlewares/autenticacao');

const router = express.Router();

// Transforma um nome em slug: "Chácara Golden!" -> "chacara-golden".
// Usamos isso pra gerar o identificador amigável da URL automaticamente,
// sem o proprietário do espaço ter que digitar um "chacara-golden" na mão.
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

// "Listas simples" são tabelas com a mesma cara (id, espaco_id, texto):
// beneficios, eventos_permitidos e pontos_referencia. Em vez de repetir a
// mesma lógica de apagar-e-regravar 3 vezes, essas duas funções fazem isso
// pra QUALQUER uma dessas tabelas, passando o nome dela como parâmetro.
function salvarListaSimples(tabela, espacoId, itens) {
    if (!Array.isArray(itens)) return;

    db.prepare(`DELETE FROM ${tabela} WHERE espaco_id = ?`).run(espacoId);
    const inserir = db.prepare(`INSERT INTO ${tabela} (espaco_id, texto) VALUES (?, ?)`);
    itens
        .map(texto => String(texto).trim())
        .filter(texto => texto.length > 0)
        .forEach(texto => inserir.run(espacoId, texto));
}

function buscarListaSimples(tabela, espacoId) {
    return db
        .prepare(`SELECT texto FROM ${tabela} WHERE espaco_id = ? ORDER BY id ASC`)
        .all(espacoId)
        .map(linha => linha.texto);
}

// Apaga e regrava benefícios, eventos permitidos, pontos de referência e
// fotos de um espaço - chamado tanto no POST (criar) quanto no PUT (editar),
// pra não repetir esse código nos dois lugares. As fotos ficam separadas
// porque a tabela delas tem uma coluna a mais ("ordem").
function salvarListasDoEspaco(espacoId, dados) {
    salvarListaSimples('beneficios', espacoId, dados.beneficios);
    salvarListaSimples('eventos_permitidos', espacoId, dados.eventos_permitidos);
    salvarListaSimples('pontos_referencia', espacoId, dados.pontos_referencia);

    if (Array.isArray(dados.fotos)) {
        db.prepare('DELETE FROM fotos_espaco WHERE espaco_id = ?').run(espacoId);
        const inserirFoto = db.prepare('INSERT INTO fotos_espaco (espaco_id, url, ordem) VALUES (?, ?, ?)');
        dados.fotos
            .map(url => String(url).trim())
            .filter(url => url.length > 0)
            .forEach((url, indice) => inserirFoto.run(espacoId, url, indice));
    }
}

// Busca as 4 listas de um espaço de uma vez (usado em GET /api/espacos/:slug
// e depois de criar/editar, pra devolver o espaço já completo)
function buscarListasDoEspaco(espacoId) {
    const fotos = db
        .prepare('SELECT url FROM fotos_espaco WHERE espaco_id = ? ORDER BY ordem ASC')
        .all(espacoId)
        .map(linha => linha.url);

    return {
        beneficios: buscarListaSimples('beneficios', espacoId),
        eventos_permitidos: buscarListaSimples('eventos_permitidos', espacoId),
        pontos_referencia: buscarListaSimples('pontos_referencia', espacoId),
        fotos
    };
}

// Busca o resumo (média + total) e a lista de avaliações de um espaço
function buscarAvaliacoes(espacoId) {
    const resumo = db
        .prepare('SELECT COUNT(*) AS total, AVG(nota) AS media FROM avaliacoes WHERE espaco_id = ?')
        .get(espacoId);

    const avaliacoes = db
        .prepare(`
            SELECT avaliacoes.nota, avaliacoes.comentario, avaliacoes.criado_em, usuarios.nome AS cliente_nome
            FROM avaliacoes
            JOIN usuarios ON usuarios.id = avaliacoes.usuario_id
            WHERE avaliacoes.espaco_id = ?
            ORDER BY avaliacoes.criado_em DESC
        `)
        .all(espacoId);

    return {
        media_avaliacoes: resumo.media, // null se não tiver nenhuma avaliação ainda
        total_avaliacoes: resumo.total,
        avaliacoes
    };
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
// Além dos dados básicos, já devolve os benefícios, as fotos extras e o
// resumo/lista de avaliações - assim a página de detalhes faz um pedido só.
// --------------------------------------------------------------------------
router.get('/espacos/:slug', (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE slug = ?').get(req.params.slug);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    const listas = buscarListasDoEspaco(espaco.id);
    const { media_avaliacoes, total_avaliacoes, avaliacoes } = buscarAvaliacoes(espaco.id);

    res.json({ ...espaco, ...listas, media_avaliacoes, total_avaliacoes, avaliacoes });
});

// --------------------------------------------------------------------------
// POST /api/espacos/:slug/visualizacao - registra que quem está logado abriu
// a página de detalhes deste espaço. Alimenta a estatística "Visualizados"
// da home do cliente (index-logado.html) - ver registrarVisualizacao() em
// js/paginas/detalhes.js.
// --------------------------------------------------------------------------
router.post('/espacos/:slug/visualizacao', autenticar, (req, res) => {
    const espaco = db.prepare('SELECT id FROM espacos WHERE slug = ?').get(req.params.slug);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    db.prepare('INSERT INTO visualizacoes (usuario_id, espaco_id) VALUES (?, ?)').run(req.usuario.id, espaco.id);

    res.status(201).json({ ok: true });
});

// --------------------------------------------------------------------------
// GET /api/meus-espacos - só os espaços do proprietário que está logado
// --------------------------------------------------------------------------
router.get('/meus-espacos', autenticar, exigirProprietario, (req, res) => {
    const espacos = db
        .prepare('SELECT * FROM espacos WHERE dono_id = ? ORDER BY criado_em DESC')
        .all(req.usuario.id);

    res.json(espacos);
});

// --------------------------------------------------------------------------
// GET /api/espacos/:id/reservas - lista as reservas recebidas NESTE espaço
// (o painel do proprietário usa isso pra mostrar quem quer reservar cada espaço dele)
// --------------------------------------------------------------------------
router.get('/espacos/:id/reservas', autenticar, exigirProprietario, (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    // Mesma checagem de autorização usada no PUT/DELETE: só o proprietário
    // DESTE espaço específico pode ver as reservas dele
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
// POST /api/espacos - cria um espaço novo (só proprietários logados)
// --------------------------------------------------------------------------
router.post('/espacos', autenticar, exigirProprietario, (req, res) => {
    const { nome, descricao, local, capacidade, preco, imagem, beneficios, eventos_permitidos, pontos_referencia, fotos } = req.body;

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
                             // assim ninguém consegue criar um espaço "em nome de outro proprietário"
            slug,
            nome,
            descricao || null,
            local || null,
            capacidade || null,
            preco || null,
            imagem || null
        );

    const espacoId = Number(resultado.lastInsertRowid);
    salvarListasDoEspaco(espacoId, { beneficios, eventos_permitidos, pontos_referencia, fotos });

    const listas = buscarListasDoEspaco(espacoId);
    const novoEspaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(espacoId);
    res.status(201).json({ ...novoEspaco, ...listas });
});

// --------------------------------------------------------------------------
// PUT /api/espacos/:id - edita um espaço (só o PROPRIETÁRIO DESSE espaço)
// --------------------------------------------------------------------------
router.put('/espacos/:id', autenticar, exigirProprietario, (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    // AUTENTICAÇÃO vs AUTORIZAÇÃO: "autenticar" só garante que a pessoa está
    // logada e é uma conta "proprietario" - mas não garante que é dona DESTE
    // espaço específico. Por isso essa checagem extra aqui: sem ela, qualquer
    // proprietário logado poderia editar o espaço de outro só sabendo o id.
    if (espaco.dono_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode editar espaços que são seus.' });
    }

    const { nome, descricao, local, capacidade, preco, imagem, beneficios, eventos_permitidos, pontos_referencia, fotos } = req.body;

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

    // Só mexe em cada lista se a pessoa mandou aquele campo (permite editar
    // só nome/preço, por exemplo, sem apagar os benefícios sem querer)
    salvarListasDoEspaco(req.params.id, { beneficios, eventos_permitidos, pontos_referencia, fotos });

    const listas = buscarListasDoEspaco(req.params.id);
    const espacoAtualizado = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);
    res.json({ ...espacoAtualizado, ...listas });
});

// --------------------------------------------------------------------------
// DELETE /api/espacos/:id - remove um espaço (só o PROPRIETÁRIO DESSE espaço)
// --------------------------------------------------------------------------
router.delete('/espacos/:id', autenticar, exigirProprietario, (req, res) => {
    const espaco = db.prepare('SELECT * FROM espacos WHERE id = ?').get(req.params.id);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    if (espaco.dono_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode remover espaços que são seus.' });
    }

    // Precisa apagar primeiro quem depende do espaço (as listas simples e as
    // fotos), senão o banco recusa apagar o espaço por causa da FOREIGN KEY
    db.prepare('DELETE FROM beneficios WHERE espaco_id = ?').run(req.params.id);
    db.prepare('DELETE FROM eventos_permitidos WHERE espaco_id = ?').run(req.params.id);
    db.prepare('DELETE FROM pontos_referencia WHERE espaco_id = ?').run(req.params.id);
    db.prepare('DELETE FROM fotos_espaco WHERE espaco_id = ?').run(req.params.id);
    db.prepare('DELETE FROM espacos WHERE id = ?').run(req.params.id);

    // 204 = "deu certo, mas não tem nada pra te devolver" (padrão pra delete)
    res.status(204).send();
});

module.exports = router;
