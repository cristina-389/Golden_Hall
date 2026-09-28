/* ==========================================================================
   GOLDEN HALL - NOTIFICAÇÕES DO PROPRIETÁRIO (paginas/dono/notificacoes-dono.html)
   Lista os avisos ativos do dono - por enquanto só "reservas pendentes"
   (GET /api/estatisticas-dono), mesma informação que antes aparecia direto
   num banner na home. Aberta ao clicar no sino do cabeçalho.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    carregarNotificacoes();
});

async function carregarNotificacoes() {
    const container = document.getElementById('lista-notificacoes');

    try {
        const estatisticas = await chamarAPI('/api/estatisticas-dono');
        const notificacoes = [];

        if (estatisticas.reservas_pendentes > 0) {
            notificacoes.push({
                classe: 'notificacao-banner--alerta',
                icone: 'bi-bell-fill',
                texto: estatisticas.reservas_pendentes === 1
                    ? 'Você tem 1 solicitação de reserva esperando resposta'
                    : `Você tem ${estatisticas.reservas_pendentes} solicitações de reserva esperando resposta`,
                link: '/frontend/paginas/dono/reservas-dono.html'
            });
        }

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
