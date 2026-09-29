/* ==========================================================================
   GOLDEN HALL - CRIAÇÃO DE NOTIFICAÇÕES
   Uma função só, chamada de vários lugares (routes/reservas.js quando uma
   reserva é aprovada/cancelada/recebida, utils/lembretesAvaliacao.js quando
   chega a hora de avaliar) - grava uma linha na tabela "notificacoes"
   (ver database/db.js), que a pessoa vê no sino do cabeçalho e na página
   de notificações (GET /api/notificacoes).
   ========================================================================== */

const db = require('../database/db');

// "tipo" decide o ícone/cor na tela (ver estiloPorTipo() em
// js/paginas/notificacoes.js e notificacoes-dono.js) - valores usados hoje:
// "reserva_aprovada", "reserva_cancelada", "avaliar_espaco", "nova_solicitacao".
function criarNotificacao(usuarioId, tipo, mensagem, link) {
    db.prepare(`
        INSERT INTO notificacoes (usuario_id, tipo, mensagem, link)
        VALUES (?, ?, ?, ?)
    `).run(usuarioId, tipo, mensagem, link || null);
}

// "10/03/2027" a partir de "2027-03-10" - usada só aqui, pra montar o texto
// das notificações já formatado (diferente do resto do back-end, que
// costuma devolver a data crua e deixar o front-end formatar)
function formatarDataBR(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

module.exports = { criarNotificacao, formatarDataBR };
