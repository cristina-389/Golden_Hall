/* ==========================================================================
   GOLDEN HALL - ROTAS DE CADASTRO E LOGIN
   Aqui usamos duas ideias novas:

   1) SENHA CRIPTOGRAFADA (bcrypt): a gente NUNCA guarda a senha da pessoa
      em texto puro no banco. Em vez disso, guarda um "hash" (tipo um
      embaralhado que não dá pra reverter). Pra conferir login, a gente não
      "descriptografa" o hash - a gente pega a senha que a pessoa digitou,
      embaralha do mesmo jeito, e compara os dois embaralhados.

   2) TOKEN (JWT): depois que a pessoa loga, o servidor devolve um "crachá"
      (um texto codificado) que prova quem ela é. O front-end guarda esse
      crachá e manda ele de volta em cada pedido futuro (ex: "criar uma
      reserva"), assim o servidor não precisa pedir email/senha de novo a
      cada clique.
   ========================================================================== */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const db = require('../database/db');
const { autenticar } = require('../middlewares/autenticacao');
const { enviarEmailRecuperacao } = require('../utils/email');

const router = express.Router();

// Quantas "voltas" de embaralhamento o bcrypt aplica na senha. Quanto maior,
// mais seguro e mais lento - 10 é um valor padrão bom pra a maioria dos casos.
const CUSTO_HASH = 10;

// --------------------------------------------------------------------------
// POST /api/cadastro
// Recebe { nome, email, senha, tipo } e cria um usuário novo no banco.
// --------------------------------------------------------------------------
router.post('/cadastro', (req, res) => {
    const { nome, email, senha, telefone, tipo } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
    }

    // Confere de novo aqui no servidor - o front-end já barra isso, mas
    // alguém poderia mandar o pedido pra API direto, pulando o formulário
    if (senha.length < 6) {
        return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
    }

    // Só aceita "proprietario" se vier explicitamente escrito assim; qualquer
    // outra coisa (ou nada) vira "cliente", que é o tipo padrão de conta
    const tipoFinal = tipo === 'proprietario' ? 'proprietario' : 'cliente';

    // Transforma a senha digitada num hash antes de guardar
    const senhaCriptografada = bcrypt.hashSync(senha, CUSTO_HASH);

    try {
        const resultado = db
            .prepare('INSERT INTO usuarios (nome, email, senha, telefone, tipo) VALUES (?, ?, ?, ?, ?)')
            .run(nome, email, senhaCriptografada, telefone || null, tipoFinal);

        const novoUsuario = {
            id: Number(resultado.lastInsertRowid),
            nome,
            email,
            telefone: telefone || null,
            tipo: tipoFinal
        };

        // Já loga a pessoa automaticamente assim que ela se cadastra,
        // devolvendo um token junto com os dados dela
        const token = gerarToken(novoUsuario);

        res.status(201).json({ usuario: novoUsuario, token });
    } catch (erro) {
        // Se o e-mail já existir, o banco recusa a inserção por causa do
        // "UNIQUE" que colocamos na coluna email (ver database/db.js)
        if (erro.message.includes('UNIQUE')) {
            return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' });
        }
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao criar a conta. Tente novamente.' });
    }
});

// --------------------------------------------------------------------------
// POST /api/login
// Recebe { email, senha }, confere se bate com algum usuário do banco.
// --------------------------------------------------------------------------
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Preencha e-mail e senha.' });
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

    // De propósito usamos a MESMA mensagem de erro tanto pra "email não
    // existe" quanto pra "senha errada" - assim ninguém mal-intencionado
    // consegue descobrir quais e-mails estão cadastrados só tentando
    if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
        return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const dadosUsuario = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        tipo: usuario.tipo
    };
    const token = gerarToken(dadosUsuario);

    res.json({ usuario: dadosUsuario, token });
});

// Monta o objeto de perfil devolvido pra tela: os dados da tabela usuarios
// (nunca a coluna "senha") + "total_reservas", que não é uma coluna, é
// contado na hora a partir da tabela reservas - reaproveitado pelas 3 rotas
// abaixo que precisam devolver o perfil completo e atualizado.
function buscarPerfilCompleto(id) {
    const usuario = db
        .prepare('SELECT id, nome, email, telefone, foto, cidade, preferencia_aluguel, bio, tipo, criado_em FROM usuarios WHERE id = ?')
        .get(id);

    if (!usuario) return null;

    const { total } = db.prepare('SELECT COUNT(*) AS total FROM reservas WHERE usuario_id = ?').get(id);
    usuario.total_reservas = total;

    return usuario;
}

// --------------------------------------------------------------------------
// GET /api/perfil - dados completos de quem está logado (usado na página
// "Meu Perfil"). Nunca devolve a coluna "senha" - só o que a tela precisa.
// --------------------------------------------------------------------------
router.get('/perfil', autenticar, (req, res) => {
    const usuario = buscarPerfilCompleto(req.usuario.id);

    if (!usuario) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    res.json(usuario);
});

// --------------------------------------------------------------------------
// PUT /api/perfil - edita nome/telefone de quem está logado. O e-mail
// propositalmente NÃO pode ser trocado por aqui (evita duplicar a checagem
// de "e-mail único" e confusão de identidade - trocar e-mail de conta
// normalmente pede uma confirmação extra, que este projeto não tem ainda).
// --------------------------------------------------------------------------
router.put('/perfil', autenticar, (req, res) => {
    const { nome, telefone, cidade } = req.body;

    if (!nome) {
        return res.status(400).json({ erro: 'O nome não pode ficar em branco.' });
    }

    db.prepare('UPDATE usuarios SET nome = ?, telefone = ?, cidade = ? WHERE id = ?')
        .run(nome, telefone || null, cidade || null, req.usuario.id);

    res.json(buscarPerfilCompleto(req.usuario.id));
});

// --------------------------------------------------------------------------
// PUT /api/perfil/sobre - edita a preferência de aluguel e a bio de quem
// está logado (o card "Sobre Você" do perfil). Os dois campos são opcionais
// e podem ficar em branco.
// --------------------------------------------------------------------------
router.put('/perfil/sobre', autenticar, (req, res) => {
    const { preferencia_aluguel, bio } = req.body;

    if (preferencia_aluguel && preferencia_aluguel.length > 100) {
        return res.status(400).json({ erro: 'A preferência de aluguel pode ter no máximo 100 caracteres.' });
    }

    if (bio && bio.length > 300) {
        return res.status(400).json({ erro: 'A bio pode ter no máximo 300 caracteres.' });
    }

    db.prepare('UPDATE usuarios SET preferencia_aluguel = ?, bio = ? WHERE id = ?')
        .run(preferencia_aluguel || null, bio || null, req.usuario.id);

    res.json(buscarPerfilCompleto(req.usuario.id));
});

// --------------------------------------------------------------------------
// PUT /api/perfil/senha - troca a senha de quem está logado. Exige a senha
// ATUAL como confirmação (senão qualquer um com o token de outra pessoa,
// ex: sessão esquecida aberta num computador compartilhado, poderia trocar
// a senha dela sem saber qual era).
// --------------------------------------------------------------------------
router.put('/perfil/senha', autenticar, (req, res) => {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ erro: 'Preencha a senha atual e a nova senha.' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 6 caracteres.' });
    }

    const usuario = db.prepare('SELECT senha FROM usuarios WHERE id = ?').get(req.usuario.id);

    if (!usuario || !bcrypt.compareSync(senhaAtual, usuario.senha)) {
        return res.status(401).json({ erro: 'A senha atual está incorreta.' });
    }

    const novaSenhaCriptografada = bcrypt.hashSync(novaSenha, CUSTO_HASH);
    db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(novaSenhaCriptografada, req.usuario.id);

    res.json({ mensagem: 'Senha alterada com sucesso.' });
});

// --------------------------------------------------------------------------
// PUT /api/perfil/foto - salva (ou remove, se "foto" vier null/vazio) a
// foto de perfil de quem está logado. A imagem chega já como base64 (o
// front-end lê o arquivo escolhido com FileReader antes de mandar) e é
// guardada direto na coluna "foto" - não existe upload de arquivo de
// verdade pro disco neste projeto, então isso evita depender de uma pasta
// de uploads separada só pra um avatar pequeno.
// --------------------------------------------------------------------------
router.put('/perfil/foto', autenticar, (req, res) => {
    const { foto } = req.body;

    // Limite generoso o bastante pra uma foto de perfil comprimida (a tela
    // já redimensiona antes de mandar), mas que evita alguém mandar um
    // arquivo enorme e inchar o banco de dados
    if (foto && foto.length > 2_000_000) {
        return res.status(413).json({ erro: 'Essa imagem é grande demais. Escolha uma foto menor.' });
    }

    db.prepare('UPDATE usuarios SET foto = ? WHERE id = ?').run(foto || null, req.usuario.id);

    res.json({ foto: foto || null });
});

// --------------------------------------------------------------------------
// GET /api/estatisticas - números reais de atividade de quem está logado,
// usados no card "Seu desenvolvimento no Golden Hall" da home do cliente
// (index-logado.html): quantos espaços favoritou, quantas reservas fez,
// quantos espaços visualizou e quantas avaliações escreveu.
// --------------------------------------------------------------------------
router.get('/estatisticas', autenticar, (req, res) => {
    const { total: favoritos } = db.prepare('SELECT COUNT(*) AS total FROM favoritos WHERE usuario_id = ?').get(req.usuario.id);
    const { total: reservas } = db.prepare('SELECT COUNT(*) AS total FROM reservas WHERE usuario_id = ?').get(req.usuario.id);
    const { total: visualizacoes } = db.prepare('SELECT COUNT(*) AS total FROM visualizacoes WHERE usuario_id = ?').get(req.usuario.id);
    const { total: comentarios } = db.prepare('SELECT COUNT(*) AS total FROM avaliacoes WHERE usuario_id = ?').get(req.usuario.id);

    res.json({ favoritos, reservas, visualizacoes, comentarios });
});

// --------------------------------------------------------------------------
// POST /api/recuperar-senha
// Recebe { email } e, se existir uma conta com esse e-mail, gera um token
// de recuperação (válido por 1 hora) e manda um link por e-mail. Devolve
// SEMPRE a mesma mensagem, exista ou não o e-mail - assim ninguém consegue
// usar essa rota pra descobrir quais e-mails estão cadastrados no site.
// --------------------------------------------------------------------------
router.post('/recuperar-senha', async (req, res) => {
    const { email } = req.body;

    const mensagemGenerica = { mensagem: 'Se esse e-mail estiver cadastrado, você vai receber um link de recuperação em instantes.' };

    if (!email) {
        return res.status(400).json({ erro: 'Informe o e-mail.' });
    }

    const usuario = db.prepare('SELECT id, email FROM usuarios WHERE email = ?').get(email);

    if (!usuario) {
        return res.json(mensagemGenerica);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = String(Date.now() + 60 * 60 * 1000); // 1 hora a partir de agora

    db.prepare('UPDATE usuarios SET token_recuperacao = ?, token_recuperacao_expira = ? WHERE id = ?')
        .run(token, expira, usuario.id);

    const linkRedefinicao = `${req.protocol}://${req.get('host')}/frontend/paginas/redefinir-senha.html?token=${token}`;

    try {
        await enviarEmailRecuperacao(usuario.email, linkRedefinicao);
    } catch (erro) {
        console.error('Erro ao enviar e-mail de recuperação:', erro);
    }

    res.json(mensagemGenerica);
});

// --------------------------------------------------------------------------
// POST /api/redefinir-senha
// Recebe { token, novaSenha }. Confere se o token existe e ainda não
// expirou, e se sim, troca a senha e apaga o token (pra não poder ser usado
// de novo).
// --------------------------------------------------------------------------
router.post('/redefinir-senha', (req, res) => {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
        return res.status(400).json({ erro: 'Preencha a nova senha.' });
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ erro: 'A nova senha precisa ter pelo menos 6 caracteres.' });
    }

    const usuario = db.prepare('SELECT id, token_recuperacao_expira FROM usuarios WHERE token_recuperacao = ?').get(token);

    if (!usuario || Number(usuario.token_recuperacao_expira) < Date.now()) {
        return res.status(400).json({ erro: 'Esse link de recuperação é inválido ou já expirou. Solicite um novo.' });
    }

    const novaSenhaCriptografada = bcrypt.hashSync(novaSenha, CUSTO_HASH);
    db.prepare('UPDATE usuarios SET senha = ?, token_recuperacao = NULL, token_recuperacao_expira = NULL WHERE id = ?')
        .run(novaSenhaCriptografada, usuario.id);

    res.json({ mensagem: 'Senha redefinida com sucesso.' });
});

// Monta o token JWT com o id e o tipo da pessoa. Esses dois dados ficam
// codificados DENTRO do token, então depois dá pra "abrir" o token (com a
// mesma chave secreta) e saber quem está fazendo o pedido, sem consultar
// o banco de novo.
function gerarToken(usuario) {
    return jwt.sign(
        { id: usuario.id, tipo: usuario.tipo },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // token deixa de funcionar sozinho depois de 7 dias
    );
}

module.exports = router;
