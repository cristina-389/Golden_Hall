/* ==========================================================================
   GOLDEN HALL - HISTÓRICO DE RESERVAS DE UM ESPAÇO, PRO DONO
   (paginas/dono/historico-espaco.html)
   Lê o "?id=..." da URL (a página de Reservas já manda pra cá com o id
   certo) e mostra TODAS as reservas já recebidas por aquele espaço - sem
   filtro de status, sem botão de ação (aprovar/recusar/cancelar continuam
   só na página de Reservas). Reaproveita GET /api/espacos/:id/reservas, a
   mesma rota já usada no modal de solicitações.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    const idEspaco = new URLSearchParams(window.location.search).get('id');
    if (!idEspaco) {
        window.location.href = '/frontend/paginas/dono/reservas-dono.html';
        return;
    }

    // GET /api/espacos/:id/reservas não devolve o nome do espaço (só as
    // reservas) - busca em GET /api/meus-espacos, que já é rápida e o dono
    // normalmente tem poucos espaços cadastrados
    try {
        const meusEspacos = await chamarAPI('/api/meus-espacos');
        const espaco = meusEspacos.find(item => String(item.id) === String(idEspaco));

        if (!espaco) {
            alert('Não foi possível encontrar esse espaço.');
            window.location.href = '/frontend/paginas/dono/reservas-dono.html';
            return;
        }

        document.getElementById('titulo-espaco-historico').textContent = espaco.nome;
        document.title = 'Histórico de ' + espaco.nome + ' | Golden Hall';
    } catch (erro) {
        console.error('Erro ao buscar o nome do espaço:', erro);
    }

    carregarHistorico(idEspaco);
});

async function carregarHistorico(idEspaco) {
    const container = document.getElementById('lista-historico-reservas');

    let reservas = [];
    try {
        reservas = await chamarAPI(`/api/espacos/${idEspaco}/reservas`);
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
        return;
    }

    if (reservas.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio-painel">
                <i class="bi bi-clock-history"></i>
                <p>Este espaço ainda não recebeu nenhuma reserva.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    reservas.forEach(reserva => container.appendChild(criarLinhaHistorico(reserva)));
}

// Mesma estrutura visual de criarLinhaReserva() (reservas-dono.js), sem os
// botões de ação - aqui é só um retrospecto, pra decidir o que fazer o dono
// usa a página de Reservas.
function criarLinhaHistorico(reserva) {
    const [ano, mes, dia] = reserva.data.split('-');
    const classeStatus = reserva.status === 'Aprovado'
        ? 'status-aprovado'
        : (reserva.status === 'Cancelado' ? 'status-cancelado' : 'status-pendente');

    const div = document.createElement('div');
    div.className = 'card-reserva';
    div.innerHTML = `
        <div class="card-reserva-header">
            <h3 class="nome-cliente"></h3>
            <span class="status-tag ${classeStatus}">${reserva.status}</span>
        </div>
        <div class="card-reserva-corpo">
            <p><i class="bi bi-calendar4-event"></i> Data: <strong>${dia}/${mes}/${ano}</strong></p>
            <p><i class="bi bi-clock"></i> Horário: <strong>${formatarHorarioReserva(reserva)}</strong></p>
            <p><i class="bi bi-award"></i> Evento: <strong>${reserva.tipo_evento || '-'}</strong></p>
            <p><i class="bi bi-people"></i> Convidados: <strong>${reserva.convidados || '-'}</strong></p>
            <p><i class="bi bi-telephone"></i> Contato: <strong>${reserva.telefone || '-'}</strong></p>
            <p><i class="bi bi-envelope"></i> E-mail: <strong class="email-cliente"></strong></p>
        </div>
    `;

    div.querySelector('.nome-cliente').textContent = reserva.cliente_nome;
    div.querySelector('.email-cliente').textContent = reserva.cliente_email;

    return div;
}
