/* ==========================================================================
   GOLDEN HALL - PÁGINA "MINHAS RESERVAS"
   Lê as reservas salvas no localStorage (chave "gh_reservas", a mesma usada
   em modais.js ao confirmar uma solicitação) e desenha um card para cada
   uma, junto com as regras de cancelamento (grátis ou com multa).
   ========================================================================== */

// Assim que a página carrega, já busca e desenha as reservas salvas
document.addEventListener('DOMContentLoaded', carregarMinhasReservas);

// Monta a lista de cards de reserva na tela (ou a mensagem de "nenhuma reserva ainda")
function carregarMinhasReservas() {
    const container = document.getElementById('lista-reservas');
    if (!container) return;

    // Busca as reservas no localStorage
    const reservas = JSON.parse(localStorage.getItem('gh_reservas')) || [];

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
        const nomeEspaco = reserva.espaco.replace(/-/g, ' ').toUpperCase();

        const cardHTML = `
            <div class="card-reserva">
                <div>
                    <div class="card-reserva-header">
                        <h3>${nomeEspaco}</h3>
                        <span class="status-tag ${classeStatus}">${status}</span>
                    </div>

                    <div class="card-reserva-corpo">
                        <p><i class="bi bi-calendar4-event"></i> Data: <strong>${formatarData(reserva.data)}</strong></p>
                        <p><i class="bi bi-clock"></i> Horário: <strong>${reserva.horario}</strong></p>
                        <p><i class="bi bi-award"></i> Evento: <strong>${reserva.tipo}</strong></p>
                        <p><i class="bi bi-people"></i> Convidados: <strong>${reserva.convidados} pessoas</strong></p>
                        <p><i class="bi bi-telephone"></i> Contato: <strong>${reserva.telefone}</strong></p>
                        
                        <p class="aviso-prazo-cancelamento">
                        <i class="bi bi-shield-exclamation"></i> 
                        <span>Cancelamento grátis até 7 dias antes do evento.</span>
                        </p>
                    </div>
                </div>

                <button class="btn-cancelar-reserva" onclick="cancelarReserva('${reserva.id}')">
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
// evento, avisa se vai ter multa ou não, e só remove a reserva do
// localStorage se a pessoa confirmar no alerta.
function cancelarReserva(idReserva) {
    let reservas = JSON.parse(localStorage.getItem('gh_reservas')) || [];
    const reserva = reservas.find(r => r.id === idReserva);

    if (!reserva) {
        alert('Reserva não encontrada.');
        return;
    }

    // Calcula a diferença em dias entre HOJE e a DATA DO EVENTO
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas datas

    const partesData = reserva.data.split('-'); // Espera formato AAAA-MM-DD
    const dataEvento = new Date(partesData[0], partesData[1] - 1, partesData[2]);

    // Calcula a diferença de tempo em milissegundos e converte para dias
    const diferencaTempo = dataEvento.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(diferencaTempo / (1000 * 3600 * 24));

    let mensagemConfirmacao = '';

    // Verifica se está dentro do prazo limite gratuito
    if (diasRestantes >= REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS) {
        mensagemConfirmacao = `
ℹ️ CANCELAMENTO GRATUITO
Falta(m) ${diasRestantes} dia(s) para o seu evento.

Você está dentro do prazo de cancelamento sem taxas (mínimo de ${REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS} dias de antecedência).

Deseja realmente cancelar esta reserva?`;
    } else {
        mensagemConfirmacao = `
⚠️ ATENÇÃO: CANCELAMENTO SUJEITO À MULTA!
Falta(m) apenas ${diasRestantes < 0 ? 0 : diasRestantes} dia(s) para o seu evento.

Como o prazo de cancelamento gratuito (${REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS} dias de antecedência) expirou, será cobrada uma taxa de rescisão de ${REGRAS_CANCELAMENTO.PORCENTAGEM_MULTA}% sobre o valor do agendamento para ressarcir o proprietário do espaço.

Deseja confirmar o cancelamento e gerar a taxa de multa?`;
    }

    // Pergunta ao usuário
    if (confirm(mensagemConfirmacao)) {
        // Remove a reserva do localStorage
        reservas = reservas.filter(r => r.id !== idReserva);
        localStorage.setItem('gh_reservas', JSON.stringify(reservas));

        if (diasRestantes < REGRAS_CANCELAMENTO.DIAS_LIMITE_GRATIS) {
            alert(`Sua reserva foi cancelada. O comprovante de cobrança da taxa de multa (${REGRAS_CANCELAMENTO.PORCENTAGEM_MULTA}%) foi enviado para o seu e-mail registrado.`);
        } else {
            alert('Sua reserva foi cancelada com sucesso sem nenhum custo adicional!');
        }

        // Recarrega os cards e contadores na tela
        carregarMinhasReservas();
    }
}

// Converte a data do formato guardado no localStorage (AAAA-MM-DD, o padrão
// de <input type="date">) para o formato brasileiro DD/MM/AAAA, só pra exibição
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
