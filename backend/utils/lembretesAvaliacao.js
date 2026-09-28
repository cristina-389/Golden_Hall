/* ==========================================================================
   GOLDEN HALL - LEMBRETE DE AVALIAÇÃO POR E-MAIL
   Depois que a data de uma reserva Aprovada já passou (o evento aconteceu de
   verdade) e o cliente ainda não avaliou o espaço, manda um e-mail
   convidando pra avaliar - assim a avaliação é sempre de uma experiência
   real, não de algo que ainda nem aconteceu. Chamado uma vez ao ligar o
   servidor e depois de tempos em tempos (ver INTERVALO_VERIFICACAO em
   server.js) - "lembrete_avaliacao_enviado" garante que cada reserva só
   recebe esse e-mail UMA vez, mesmo rodando a verificação várias vezes.
   O aviso dentro do próprio site (sino/notificacoes.js) não depende desse
   e-mail - é calculado ao vivo em GET /api/estatisticas, então continua
   aparecendo até a pessoa avaliar, mesmo depois do e-mail já ter sido
   enviado.
   ========================================================================== */

const db = require('../database/db');
const { enviarEmailLembreteAvaliacao } = require('./email');

async function verificarLembretesAvaliacao() {
    // Reservas Aprovadas, com a data já passada, sem avaliação ainda e que
    // nunca receberam esse e-mail antes
    const reservas = db
        .prepare(`
            SELECT reservas.id, usuarios.email, usuarios.nome AS cliente_nome, espacos.nome AS espaco_nome
            FROM reservas
            JOIN usuarios ON usuarios.id = reservas.usuario_id
            JOIN espacos ON espacos.id = reservas.espaco_id
            LEFT JOIN avaliacoes ON avaliacoes.reserva_id = reservas.id
            WHERE reservas.status = 'Aprovado'
              AND reservas.data < date('now')
              AND reservas.lembrete_avaliacao_enviado = 0
              AND avaliacoes.id IS NULL
        `)
        .all();

    for (const reserva of reservas) {
        try {
            await enviarEmailLembreteAvaliacao(
                reserva.email,
                reserva.cliente_nome,
                reserva.espaco_nome,
                `${process.env.URL_SITE || 'http://localhost:3000'}/frontend/paginas/cliente/reservas.html`
            );
        } catch (erro) {
            // Um e-mail que falhar não pode travar os outros nem marcar
            // como enviado - tenta de novo na próxima verificação
            console.error(`Erro ao enviar lembrete de avaliação (reserva ${reserva.id}):`, erro.message);
            continue;
        }

        db.prepare('UPDATE reservas SET lembrete_avaliacao_enviado = 1 WHERE id = ?').run(reserva.id);
    }
}

module.exports = { verificarLembretesAvaliacao };
