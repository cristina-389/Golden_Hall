/* ==========================================================================
   GOLDEN HALL - ROTAS DE RESERVAS
   Todas as rotas daqui exigem login (não faz sentido reservar sem saber
   quem está reservando) - exceto a de "datas ocupadas", que é pública,
   porque qualquer visitante navegando no site precisa ver o calendário
   antes mesmo de fazer login.
   ========================================================================== */

const express = require('express');
const db = require('../database/db');
const { autenticar, exigirProprietario } = require('../middlewares/autenticacao');
const { criarNotificacao, formatarDataBR } = require('../utils/notificacoes');

const router = express.Router();

// --------------------------------------------------------------------------
// GET /api/espacos/:slug/datas-ocupadas - PÚBLICA
// Devolve só a lista de datas (ex: ["2026-09-10", "2026-09-15"]) que já têm
// reserva pra esse espaço. É o que o calendário usa pra pintar os dias de
// vermelho, sem precisar mostrar os detalhes de quem reservou.
// --------------------------------------------------------------------------
router.get('/espacos/:slug/datas-ocupadas', (req, res) => {
    const espaco = db.prepare('SELECT id FROM espacos WHERE slug = ?').get(req.params.slug);

    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    // "status != 'Cancelado'" - uma reserva cancelada libera a data de novo
    const linhas = db
        .prepare("SELECT data FROM reservas WHERE espaco_id = ? AND status != 'Cancelado'")
        .all(espaco.id);

    res.json(linhas.map(linha => linha.data));
});

// --------------------------------------------------------------------------
// POST /api/reservas - cria uma solicitação de reserva (precisa estar logado)
// --------------------------------------------------------------------------
router.post('/reservas', autenticar, (req, res) => {
    const { espaco_slug, data, horario, horario_termino, tipo_evento, convidados, telefone, observacoes } = req.body;

    if (!espaco_slug || !data) {
        return res.status(400).json({ erro: 'Informe o espaço e a data.' });
    }

    const espaco = db.prepare('SELECT id, dono_id, nome FROM espacos WHERE slug = ?').get(espaco_slug);
    if (!espaco) {
        return res.status(404).json({ erro: 'Espaço não encontrado.' });
    }

    // MESMA regra que já existia no front-end (modais.js), só que agora
    // verificada no servidor - não dá mais pra "trapacear" reservando a
    // mesma data em duas abas diferentes, por exemplo
    const dataOcupada = db
        .prepare("SELECT id FROM reservas WHERE espaco_id = ? AND data = ? AND status != 'Cancelado'")
        .get(espaco.id, data);

    if (dataOcupada) {
        return res.status(409).json({ erro: 'Essa data já está ocupada para este espaço.' });
    }

    const resultado = db
        .prepare(`
            INSERT INTO reservas (espaco_id, usuario_id, data, horario, horario_termino, tipo_evento, convidados, telefone, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
            espaco.id,
            req.usuario.id, // vem do token - a pessoa não pode reservar "em nome de outra"
            data,
            horario || null,
            horario_termino || null,
            tipo_evento || null,
            convidados || null,
            telefone || null,
            observacoes || null
        );

    const novaReserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(novaReserva);

    // Avisa o PROPRIETÁRIO desse espaço que chegou uma solicitação nova -
    // ele vê isso no sino/página de notificações dele
    criarNotificacao(
        espaco.dono_id,
        'nova_solicitacao',
        `Nova solicitação de reserva: ${espaco.nome} (${formatarDataBR(data)})`,
        '/frontend/paginas/dono/reservas-dono.html'
    );
});

// --------------------------------------------------------------------------
// GET /api/minhas-reservas - lista as reservas de quem está logado
// O "LEFT JOIN avaliacoes" traz junto se cada reserva já foi avaliada ou não
// (campo "avaliado": 1 ou 0) - é o que decide se a tela mostra o botão
// "Avaliar" ou "Você já avaliou" pra cada reserva aprovada. Usada tanto por
// "Minhas Reservas" (reservas.js) quanto pelo "Histórico" (historico.js) -
// cada página filtra essa mesma lista de um jeito diferente (ver
// separarReservaAtiva() em reservas.js).
// --------------------------------------------------------------------------
router.get('/minhas-reservas', autenticar, (req, res) => {
    // JOIN: busca nas duas tabelas ao mesmo tempo, ligando pelo espaco_id -
    // assim já vem o nome do espaço junto, sem precisar de um segundo pedido
    const reservas = db
        .prepare(`
            SELECT
                reservas.*,
                espacos.nome AS espaco_nome,
                espacos.slug AS espaco_slug,
                espacos.imagem AS espaco_imagem,
                CASE WHEN avaliacoes.id IS NULL THEN 0 ELSE 1 END AS avaliado
            FROM reservas
            JOIN espacos ON espacos.id = reservas.espaco_id
            LEFT JOIN avaliacoes ON avaliacoes.reserva_id = reservas.id
            WHERE reservas.usuario_id = ?
            ORDER BY reservas.criado_em DESC
        `)
        .all(req.usuario.id);

    res.json(reservas);

    // Depois de responder (com o valor "de antes"), marca como "visto" toda
    // reserva Cancelada que essa pessoa ainda não tinha visto - assim, na
    // primeira vez que ela abre "Minhas Reservas" depois de um
    // cancelamento (seja por ela mesma ou pelo proprietário), o aviso ainda
    // aparece lá; da próxima vez que abrir, essa reserva já foi pro
    // histórico (ver separarReservaAtiva() em reservas.js).
    db.prepare(`
        UPDATE reservas SET visto_pelo_cliente = 1
        WHERE usuario_id = ? AND status = 'Cancelado' AND visto_pelo_cliente = 0
    `).run(req.usuario.id);
});

// --------------------------------------------------------------------------
// POST /api/reservas/:id/avaliacao - cliente avalia uma reserva já aprovada
// Body: { nota, comentario }. Só dá pra avaliar reserva PRÓPRIA, com status
// "Aprovado", e só UMA vez (a UNIQUE(reserva_id) do banco garante isso, mas
// conferimos antes também pra devolver uma mensagem de erro clara).
// --------------------------------------------------------------------------
router.post('/reservas/:id/avaliacao', autenticar, (req, res) => {
    const notaNumero = Number(req.body.nota);
    const comentario = req.body.comentario;

    if (!notaNumero || notaNumero < 1 || notaNumero > 5) {
        return res.status(400).json({ erro: 'Dê uma nota de 1 a 5 estrelas.' });
    }

    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);

    if (!reserva) {
        return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    if (reserva.usuario_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode avaliar as suas próprias reservas.' });
    }

    if (reserva.status !== 'Aprovado') {
        return res.status(400).json({ erro: 'Só é possível avaliar reservas já aprovadas pelo proprietário.' });
    }

    // Só dá pra avaliar depois que o evento realmente aconteceu - assim a
    // avaliação é sempre de uma experiência de verdade, não de algo que
    // ainda nem rolou (ver o lembrete que avisa quando chega essa hora, em
    // utils/lembretesAvaliacao.js e GET /api/estatisticas)
    const { data: hoje } = db.prepare("SELECT date('now') AS data").get();
    if (reserva.data > hoje) {
        return res.status(400).json({ erro: 'Você só pode avaliar depois que o evento acontecer.' });
    }

    const jaAvaliada = db.prepare('SELECT id FROM avaliacoes WHERE reserva_id = ?').get(req.params.id);
    if (jaAvaliada) {
        return res.status(409).json({ erro: 'Você já avaliou esta reserva.' });
    }

    db.prepare(`
        INSERT INTO avaliacoes (espaco_id, usuario_id, reserva_id, nota, comentario)
        VALUES (?, ?, ?, ?, ?)
    `).run(reserva.espaco_id, req.usuario.id, reserva.id, notaNumero, comentario || null);

    res.status(201).json({ ok: true });
});

// --------------------------------------------------------------------------
// DELETE /api/reservas/:id - cancela uma reserva, só a própria. Apesar do
// nome do método HTTP, não apaga a linha de verdade - só marca como
// "Cancelado" (mesma ideia de quando o PROPRIETÁRIO recusa/cancela, ver PUT
// /api/reservas/:id/status), pra essa reserva continuar existindo e um dia
// aparecer no histórico. Como foi a própria pessoa que cancelou, ela já
// está ciente na hora - "visto_pelo_cliente" já nasce marcado, sem precisar
// esperar ela abrir "Minhas Reservas" de novo (ver GET /api/minhas-reservas).
// --------------------------------------------------------------------------
router.delete('/reservas/:id', autenticar, (req, res) => {
    const { motivo } = req.body;

    // JOIN com espacos pra saber quem é o proprietário e o nome do espaço -
    // usados pra avisar o proprietário quando a reserva já estava Aprovada
    const reserva = db
        .prepare(`
            SELECT reservas.*, espacos.dono_id, espacos.nome AS espaco_nome
            FROM reservas
            JOIN espacos ON espacos.id = reservas.espaco_id
            WHERE reservas.id = ?
        `)
        .get(req.params.id);

    if (!reserva) {
        return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    if (reserva.usuario_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode cancelar reservas suas.' });
    }

    // Se o proprietário já recusou (ou cancelou) essa reserva, não faz
    // sentido o cliente "cancelar" de novo - a reserva já não é mais válida
    if (reserva.status === 'Cancelado') {
        return res.status(400).json({ erro: 'Esta reserva já foi cancelada.' });
    }

    // Cancelar uma reserva ainda Pendente não exige motivo (o proprietário
    // nem tinha aprovado nada ainda) - mas uma já Aprovada, sim: ele já
    // tinha essa data reservada de verdade, então precisa saber por quê.
    if (reserva.status === 'Aprovado' && !motivo) {
        return res.status(400).json({ erro: 'Conte o motivo do cancelamento - o proprietário vai ver essa mensagem.' });
    }

    const motivoFinal = reserva.status === 'Aprovado' ? motivo : null;

    // Uma reserva Aprovada pode já ter sido avaliada (ver POST
    // /api/reservas/:id/avaliacao) - "avaliacoes.reserva_id" é uma FOREIGN
    // KEY pra "reservas". Cancelar continua sendo gratuito "a qualquer
    // momento" (a promessa do front-end), então a avaliação some junto.
    db.prepare('DELETE FROM avaliacoes WHERE reserva_id = ?').run(req.params.id);
    db.prepare('UPDATE reservas SET status = ?, motivo_recusa = ?, visto_pelo_cliente = 1 WHERE id = ?')
        .run('Cancelado', motivoFinal, req.params.id);
    res.status(204).send();

    // Avisa o PROPRIETÁRIO só quando era uma reserva já Aprovada que o
    // cliente cancelou - ele já contava com essa data, então precisa saber
    if (reserva.status === 'Aprovado') {
        criarNotificacao(
            reserva.dono_id,
            'reserva_cancelada',
            `O cliente cancelou a reserva aprovada no ${reserva.espaco_nome} (${formatarDataBR(reserva.data)}). Motivo: ${motivo}`,
            '/frontend/paginas/dono/reservas-dono.html'
        );
    }
});

// --------------------------------------------------------------------------
// PUT /api/reservas/:id/status - o PROPRIETÁRIO do espaço aprova (ou recusa)
// uma reserva recebida. Body: { status, motivo } ("Aprovado" ou "Cancelado" -
// "motivo" é a justificativa da recusa/cancelamento, opcional, só faz
// sentido junto de "Cancelado" - o cliente vê esse texto em "Minhas Reservas".
// --------------------------------------------------------------------------
router.put('/reservas/:id/status', autenticar, exigirProprietario, (req, res) => {
    const { status, motivo } = req.body;

    if (!['Aprovado', 'Cancelado'].includes(status)) {
        return res.status(400).json({ erro: 'Status inválido.' });
    }

    // JOIN com espacos pra conferir de quem é o espaço dessa reserva -
    // só o proprietário DAQUELE espaço específico pode aprovar/recusar
    const reserva = db
        .prepare(`
            SELECT reservas.*, espacos.dono_id, espacos.nome AS espaco_nome
            FROM reservas
            JOIN espacos ON espacos.id = reservas.espaco_id
            WHERE reservas.id = ?
        `)
        .get(req.params.id);

    if (!reserva) {
        return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    if (reserva.dono_id !== req.usuario.id) {
        return res.status(403).json({ erro: 'Você só pode gerenciar reservas dos seus próprios espaços.' });
    }

    // O motivo só faz sentido quando a reserva está sendo recusada/cancelada
    // - se por algum motivo vier junto de "Aprovado", ignora (fica null)
    const motivoFinal = status === 'Cancelado' ? (motivo || null) : null;

    // Cancelamento feito pelo PROPRIETÁRIO nasce "não visto" - o cliente só
    // fica sabendo quando abrir "Minhas Reservas" (ver GET
    // /api/minhas-reservas), então essa reserva continua aparecendo lá até
    // esse momento, em vez de já ir direto pro histórico sem avisar ninguém.
    db.prepare('UPDATE reservas SET status = ?, motivo_recusa = ?, visto_pelo_cliente = 0 WHERE id = ?')
        .run(status, motivoFinal, req.params.id);

    const reservaAtualizada = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    res.json(reservaAtualizada);

    // Avisa o CLIENTE que a decisão saiu - ele vê isso no sino/página de
    // notificações dele, além do aviso que já aparece direto no card da
    // reserva (em "Minhas Reservas")
    if (status === 'Aprovado') {
        criarNotificacao(
            reserva.usuario_id,
            'reserva_aprovada',
            `Sua reserva no ${reserva.espaco_nome} (${formatarDataBR(reserva.data)}) foi aprovada! O proprietário vai entrar em contato por WhatsApp ou e-mail.`,
            '/frontend/paginas/cliente/reservas.html'
        );
    } else {
        criarNotificacao(
            reserva.usuario_id,
            'reserva_cancelada',
            `Sua reserva no ${reserva.espaco_nome} (${formatarDataBR(reserva.data)}) foi cancelada pelo proprietário.`,
            '/frontend/paginas/cliente/reservas.html'
        );
    }
});

module.exports = router;
