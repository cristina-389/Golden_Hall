/* ==========================================================================
   GOLDEN HALL - NOTIFICAÇÕES DO PROPRIETÁRIO (paginas/dono/notificacoes-dono.html)
   Lista TODAS as notificações reais já recebidas (GET /api/notificacoes) -
   nova solicitação de reserva, entre outras que possam vir no futuro (ver
   utils/notificacoes.js no back-end, chamado de dentro de
   routes/reservas.js). Ficam salvas mesmo depois de vistas - só o destaque
   (pulsando, com opacidade cheia) some depois da primeira vez que essa
   página é aberta (GET /api/notificacoes marca como lida DEPOIS de
   responder).
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

// Decide o ícone/cor de cada notificação com base no "tipo" salvo (ver
// utils/notificacoes.js) - qualquer tipo novo que a gente esquecer de
// mapear aqui cai no "alerta" genérico, em vez de quebrar a página
function estiloPorTipo(tipo) {
    switch (tipo) {
        case 'nova_solicitacao':
            return { classe: 'notificacao-banner--alerta', icone: 'bi-bell-fill' };
        case 'reserva_cancelada':
            return { classe: 'notificacao-banner--erro', icone: 'bi-x-circle-fill' };
        default:
            return { classe: 'notificacao-banner--alerta', icone: 'bi-info-circle-fill' };
    }
}

async function carregarNotificacoes() {
    const container = document.getElementById('lista-notificacoes');

    try {
        const notificacoes = await chamarAPI('/api/notificacoes');
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
        const { classe, icone } = estiloPorTipo(notificacao.tipo);

        const item = document.createElement('a');
        item.href = notificacao.link || '#';
        item.className = `notificacao-banner ${classe} ${notificacao.lida ? '' : 'notificacao-banner--nao-lida'}`;
        item.innerHTML = `
            <i class="bi ${icone}"></i>
            <span></span>
            <i class="bi bi-chevron-right seta-notificacao"></i>
        `;
        item.querySelector('span').textContent = notificacao.mensagem;
        container.appendChild(item);
    });
}
