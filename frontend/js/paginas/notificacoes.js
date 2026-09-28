/* ==========================================================================
   GOLDEN HALL - NOTIFICAÇÕES DO CLIENTE (paginas/cliente/notificacoes.html)
   Lista os avisos ativos do cliente: "reserva aprovada" e "evento já
   aconteceu, que tal avaliar?" (os dois vêm de GET /api/estatisticas) -
   mesma informação que antes aparecia direto num banner na home. Aberta ao
   clicar no sino do cabeçalho.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const usuario = obterUsuarioLogado();
    if (!usuario) {
        window.location.href = '/frontend/index.html';
        return;
    }
    if (usuario.tipo === 'proprietario') {
        window.location.href = '/frontend/paginas/dono/notificacoes-dono.html';
        return;
    }

    carregarNotificacoes();
});

async function carregarNotificacoes() {
    const container = document.getElementById('lista-notificacoes');

    try {
        const estatisticas = await chamarAPI('/api/estatisticas');
        const notificacoes = [];

        if (estatisticas.proxima_reserva_aprovada) {
            const [ano, mes, dia] = estatisticas.proxima_reserva_aprovada.data.split('-');
            notificacoes.push({
                classe: 'notificacao-banner--sucesso',
                icone: 'bi-check-circle-fill',
                texto: `Sua reserva no ${estatisticas.proxima_reserva_aprovada.espaco_nome} (${dia}/${mes}) foi aprovada! ` +
                    `O proprietário vai entrar em contato por WhatsApp ou e-mail.`,
                link: '/frontend/paginas/cliente/reservas.html'
            });
        }

        // Um aviso por evento já realizado e ainda sem avaliação - mesmo
        // convite que o e-mail já manda (ver utils/lembretesAvaliacao.js no
        // back-end), só que aqui dentro do site
        (estatisticas.reservas_para_avaliar || []).forEach(reserva => {
            const [ano, mes, dia] = reserva.data.split('-');
            notificacoes.push({
                classe: 'notificacao-banner--sucesso',
                icone: 'bi-star-fill',
                texto: `Seu evento no ${reserva.espaco_nome} (${dia}/${mes}) já aconteceu! Que tal avaliar sua experiência?`,
                link: '/frontend/paginas/cliente/reservas.html'
            });
        });

        renderizarNotificacoes(notificacoes);
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
    }
}

function renderizarNotificacoes(notificacoes) {
    const container = document.getElementById('lista-notificacoes');

    if (notificacoes.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio-painel">
                <i class="bi bi-bell-slash"></i>
                <p>Nenhuma notificação por enquanto.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    notificacoes.forEach(notificacao => {
        const item = document.createElement('a');
        item.href = notificacao.link;
        item.className = `notificacao-banner ${notificacao.classe}`;
        item.innerHTML = `
            <i class="bi ${notificacao.icone}"></i>
            <span></span>
            <i class="bi bi-chevron-right seta-notificacao"></i>
        `;
        item.querySelector('span').textContent = notificacao.texto;
        container.appendChild(item);
    });
}
