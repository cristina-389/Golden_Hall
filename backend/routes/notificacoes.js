/* ==========================================================================
   GOLDEN HALL - ROTAS DE NOTIFICAÇÕES
   As notificações em si são criadas de outros lugares (ver
   utils/notificacoes.js) - aqui só tem como LER: a contagem de não lidas
   (pro sino do cabeçalho, sem marcar nada como lida) e a lista completa
   (pra página de notificações, que aí sim marca como lida).
   ========================================================================== */

const express = require('express');
const db = require('../database/db');
const { autenticar } = require('../middlewares/autenticacao');

const router = express.Router();

// --------------------------------------------------------------------------
// GET /api/notificacoes/contagem - só o número de não lidas, pra bolinha do
// sino no cabeçalho (não marca nada como lida - só abrir a página de
// notificações de fato conta como "ver")
// --------------------------------------------------------------------------
router.get('/notificacoes/contagem', autenticar, (req, res) => {
    const { total } = db
        .prepare('SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = ? AND lida = 0')
        .get(req.usuario.id);

    res.json({ nao_lidas: total });
});

// --------------------------------------------------------------------------
// GET /api/notificacoes - lista todas as notificações de quem está logado,
// mais recente primeiro. Devolve o estado ATUAL de "lida" (pra destacar as
// novas na tela) e só DEPOIS marca todas como lidas - assim, na primeira
// vez que a pessoa abre essa página depois de uma notificação nova, ela
// ainda vê o destaque; da próxima vez que abrir, já não tem mais novidade.
// --------------------------------------------------------------------------
router.get('/notificacoes', autenticar, (req, res) => {
    const notificacoes = db
        .prepare('SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY criado_em DESC')
        .all(req.usuario.id);

    res.json(notificacoes);

    db.prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ? AND lida = 0').run(req.usuario.id);
});

module.exports = router;
