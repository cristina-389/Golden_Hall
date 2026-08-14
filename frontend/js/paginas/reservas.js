/* ==========================================================================
   GOLDEN HALL - PÁGINA "MINHAS RESERVAS"
   Busca as reservas de quem está logado em GET /api/minhas-reservas (a API
   já devolve o nome do espaço junto, graças ao JOIN feito no back-end) e
   desenha um card para cada uma, junto com as regras de cancelamento
   (grátis ou com multa).
   ========================================================================== */

// Assim que a página carrega, já busca e desenha as reservas salvas
document.addEventListener('DOMContentLoaded', carregarMinhasReservas);

// Monta a lista de cards de reserva na tela (ou a mensagem de "nenhuma reserva ainda")
async function carregarMinhasReservas() {
    const container = document.getElementById('lista-reservas');
    if (!container) return;

    // Essa página exige estar logado - sem token, a API responderia 401
    if (!obterUsuarioLogado()) {
        container.innerHTML = `
            <div class="reservas-vazias">
                <i class="bi bi-lock"></i>
                <p>Entre na sua conta para ver suas reservas.</p>
                <button class="btn-novo-espaco" onclick="abrirModalLogin()">Entrar</button>
            </div>
        `;
        return;
    }

    let reservas = [];
    try {
        reservas = await chamarAPI('/api/minhas-reservas');
    } catch (erro) {
        container.innerHTML = `<div class="reservas-vazias"><p>${erro.message}</p></div>`;
        return;
    }

    // Atualiza os contadores no topo da tela
    atualizarEstatisticas(reservas);

    if (reservas.length === 0) {
        container.innerHTML = `
            <div class="reservas-vazias">
                <i class="bi bi-calendar-x"></i>
                <p>Você ainda não possui nenhuma reserva realizada no Golden Hall.</p>
                <a href="buscar.html" class="btn-novo-espaco"><i class="bi bi-search"></i> Explorar Espaços Disponíveis</a>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    reservas.forEach((reserva) => {
        const status = reserva.status || 'Pendente';
        const classeStatus = status.toLowerCase() === 'aprovado' ? 'status-aprovado' : 'status-pendente';

        const cardHTML = `
            <div class="card-reserva">
                <div>
                    <div class="card-reserva-header">
                        <h3>${reserva.espaco_nome}</h3>
                        <span class="status-tag ${classeStatus}">${status}</span>
                    </div>

                    <div class="card-reserva-corpo">
                        <p><i class="bi bi-calendar4-event"></i> Data: <strong>${formatarData(reserva.data)}</strong></p>
                        <p><i class="bi bi-clock"></i> Horário: <strong>${reserva.horario || '-'}</strong></p>
                        <p><i class="bi bi-award"></i> Evento: <strong>${reserva.tipo_evento || '-'}</strong></p>
                        <p><i class="bi bi-people"></i> Convidados: <strong>${reserva.convidados || '-'} pessoas</strong></p>
                        <p><i class="bi bi-telephone"></i> Contato: <strong>${reserva.telefone || '-'}</strong></p>

                        <p class="aviso-prazo-cancelamento">
                        <i class="bi bi-shield-exclamation"></i>
                        <span>Cancelamento grátis até 7 dias antes do evento.</span>
                        </p>
                    </div>
                </div>

                <button class="btn-cancelar-reserva" onclick="cancelarReserva(${reserva.id}, '${reserva.data}')">
                    <i class="bi bi-trash"></i> Cancelar Reserva
                </button>
            </div>
        `;

        container.innerHTML += cardHTML;
    });
}

// Preenche os números do painel no topo da página (total de reservas,
// quantas estão pendentes e quantas já foram aprovadas)
function atualizarEstatisticas(reservas) {
    const totalEl = document.getElementById('stat-total');
    const pendentesEl = document.getElementById('stat-pendentes');
    const aprovadasEl = document.getElementById('stat-aprovadas');

    if (!totalEl || !pendentesEl || !aprovadasEl) return;

    const total = reservas.length;
    const pendentes = reservas.filter(r => (r.status || 'Pendente').toLowerCase() === 'pendente').length;
    const aprovadas = reservas.filter(r => (r.status || '').toLowerCase() === 'aprovado').length;

    totalEl.textContent = total;
    pendentesEl.textContent = pendentes;
    aprovadasEl.textContent = aprovadas;
}

// Configuração da Regra de Negócio
const REGRAS_CANCELAMENTO = {
    DIAS_LIMITE_GRATIS: 7, // Até quantos dias antes da data o cancelamento é 100% gratuito
    PORCENTAGEM_MULTA: 30  // Porcentagem da taxa cobrada após o prazo
};

// Botão "Cancelar Reserva" de um card: calcula quantos dias faltam pro
// evento, avisa se vai ter multa ou não, e só chama a API (DELETE
// /api/reservas/:id) se a pessoa confirmar no alerta. O cálculo de multa
// aqui é só uma mensagem pro usuário - o back-end é quem decide de verdade
// se pode cancelar (só o dono da reserva consegue, ver routes/reservas.js).
// "dataEventoISO" vem no formato AAAA-MM-DD, direto do banco.
async function cancelarReserva(idReserva, dataEventoISO) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [ano, mes, dia] = dataEventoISO.split('-');
    const dataEvento = new Date(ano, mes - 1, dia);
    const diasRestantes = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    let mensagemConfirmacao;
    if (diasRestantes >= REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS) {
        mensagemConfirmacao = `ℹ️ CANCELAMENTO GRATUITO\n\nVocê está dentro do prazo de cancelamento sem taxas (mínimo de ${REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS} dias de antecedência).\n\nDeseja realmente cancelar esta reserva?`;
    } else {
        mensagemConfirmacao = `⚠️ ATENÇÃO: CANCELAMENTO SUJEITO À MULTA!\n\nComo o prazo de cancelamento gratuito (${REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS} dias de antecedência) expirou, será cobrada uma taxa de rescisão de ${REGRAS_CANCELAMENTO.PORCENTAGEM_MULTA}% sobre o valor do agendamento.\n\nDeseja confirmar o cancelamento e gerar a taxa de multa?`;
    }

    if (!confirm(mensagemConfirmacao)) return;

    try {
        await chamarAPI(`/api/reservas/${idReserva}`, { method: 'DELETE' });
        alert('Sua reserva foi cancelada com sucesso!');
        carregarMinhasReservas(); // recarrega os cards e contadores na tela
    } catch (erro) {
        alert('Não foi possível cancelar: ' + erro.message);
    }
}

// Converte a data do formato guardado no banco (AAAA-MM-DD, o padrão de
// <input type="date">) para o formato brasileiro DD/MM/AAAA, só pra exibição
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
