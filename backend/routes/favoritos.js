/* ==========================================================================
   GOLDEN HALL - ROTAS DE FAVORITOS
   Diferente de reservas, favoritar um espaço não tem "disputa" (duas
   pessoas podem favoritar o mesmo espaço sem problema nenhum), por isso
   as rotas aqui são bem mais simples. Ainda assim exigem login, porque
   a lista de favoritos é "de alguém" - não faria sentido sem saber de quem.
   ========================================================================== */

const express = require('express');
const db = require('../database/db');
const { autenticar } = require('../middlewares/autenticacao');

const router = express.Router();

// --------------------------------------------------------------------------
// GET /api/favoritos - lista os espaços favoritados por quem está logado
// Já devolve os dados do espaço junto (JOIN), pra página de favoritos não
// precisar fazer um pedido a mais pra cada card.
// --------------------------------------------------------------------------
router.get('/favoritos', autenticar, (req, res) => {
    const favoritos = db
        .prepare(`
            SELECT espacos.*
            FROM favoritos
            JOIN espacos ON espacos.id = favoritos.espaco_id
            WHERE favoritos.usuario_id = ?
            ORDER BY favoritos.criado_em DESC
        `)
        .all(req.usuario.id);

    res.json(favoritos);
});

// --------------------------------------------------------------------------
// POST /api/favoritos/toggle - adiciona OU remove um espaço dos favoritos
// (o mesmo botão de coração serve pras duas ações, então uma rota só resolve).
// Body: { espaco_slug }
// --------------------------------------------------------------------------
router.post('/favoritos/toggle', autenticar, (req, res) => {
    const { espaco_slug } = req.body;

    if (!espaco_slug) {
        return res.status(400).json({ erro: 'Informe o espaço.' });
    }

    const espaco = db.prepare('SELECT id FROM espacos WHERE slug = ?').get(espaco_slug);
    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    const jaFavoritado = db
        .prepare('SELECT id FROM favoritos WHERE usuario_id = ? AND espaco_id = ?')
        .get(req.usuario.id, espaco.id);

    if (jaFavoritado) {
        db.prepare('DELETE FROM favoritos WHERE id = ?').run(jaFavoritado.id);
        return res.json({ favoritado: false });
    }

    db.prepare('INSERT INTO favoritos (usuario_id, espaco_id) VALUES (?, ?)').run(req.usuario.id, espaco.id);
    res.json({ favoritado: true });
});

module.exports = router;
