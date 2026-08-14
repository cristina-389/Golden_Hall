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
const db = require('../database/db');
const { autenticar } = require('../middlewares/autenticacao');

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

    // Só aceita "dono" se vier explicitamente escrito assim; qualquer outra
    // coisa (ou nada) vira "cliente", que é o tipo padrão de conta
    const tipoFinal = tipo === 'dono' ? 'dono' : 'cliente';

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

// --------------------------------------------------------------------------
// GET /api/perfil - dados completos de quem está logado (usado na página
// "Meu Perfil"). Nunca devolve a coluna "senha" - só o que a tela precisa.
// --------------------------------------------------------------------------
router.get('/perfil', autenticar, (req, res) => {
    const usuario = db
        .prepare('SELECT id, nome, email, telefone, tipo, criado_em FROM usuarios WHERE id = ?')
        .get(req.usuario.id);

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
    const { nome, telefone } = req.body;

    if (!nome) {
        return res.status(400).json({ erro: 'O nome não pode ficar em branco.' });
    }

    db.prepare('UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?').run(nome, telefone || null, req.usuario.id);

    const usuario = db
        .prepare('SELECT id, nome, email, telefone, tipo, criado_em FROM usuarios WHERE id = ?')
        .get(req.usuario.id);

    res.json(usuario);
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
