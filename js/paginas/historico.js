/* ==========================================================================
   GOLDEN HALL - HISTÓRICO DE RESERVAS DO CLIENTE (paginas/cliente/historico.html)
   Mostra as reservas que já saíram de "Minhas Reservas": eventos Aprovados
   que já aconteceram (é aqui que mora o botão "Avaliar Espaço", já que só
   dá pra avaliar depois do evento - ver POST /api/reservas/:id/avaliacao)
   e reservas Canceladas que a pessoa já ficou ciente. Reaproveita a mesma
   GET /api/minhas-reservas de reservas.js, só filtrando o outro pedaço da
   lista - ver ehReservaDeHistorico() logo abaixo.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', carregarHistorico);

async function carregarHistorico() {
    const container = document.getElementById('lista-historico');
    if (!container) return;

    if (!obterUsuarioLogado()) {
        window.location.href = '/frontend/index.html';
        return;
    }

    let reservas = [];
    try {
        reservas = await chamarAPI('/api/minhas-reservas');
    } catch (erro) {
        container.innerHTML = `<div class="reservas-vazias"><p>${erro.message}</p></div>`;
        return;
    }

    const hoje = new Date();
    const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const historico = reservas.filter(reserva => ehReservaDeHistorico(reserva, hojeString));

    if (historico.length === 0) {
        container.innerHTML = `
            <div class="reservas-vazias">
                <i class="bi bi-clock-history"></i>
                <p>Nenhuma reserva no histórico ainda.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    historico.forEach(reserva => {
        container.innerHTML += criarCardHistorico(reserva);
    });
}

// Complemento exato de ehReservaAtiva() (reservas.js): reserva Aprovada
// cujo evento já aconteceu, ou reserva Cancelada que a pessoa já viu (ver
// "visto_pelo_cliente" em GET /api/minhas-reservas, routes/reservas.js)
function ehReservaDeHistorico(reserva, hojeString) {
    const status = reserva.status || 'Pendente';

    if (status === 'Aprovado') return reserva.data <= hojeString;
    if (status === 'Cancelado') return Boolean(reserva.visto_pelo_cliente);

    return false;
}

function criarCardHistorico(reserva) {
    const status = reserva.status || 'Pendente';
    const classeStatus = status === 'Aprovado' ? 'status-aprovado' : 'status-cancelado';

    // Só reservas Aprovadas (o evento já aconteceu, é a única condição pra
    // estarem aqui) podem ser avaliadas - e só uma vez (ver routes/reservas.js).
    // "avaliado" vem pronto da API (LEFT JOIN avaliacoes em GET /api/minhas-reservas).
    let botaoAvaliacao = '';
    if (status === 'Aprovado') {
        botaoAvaliacao = reserva.avaliado
            ? `<span class="ja-avaliado"><i class="bi bi-star-fill"></i> Você já avaliou este espaço</span>`
            : `<button class="btn-avaliar-reserva" onclick="abrirModalAvaliacao(${reserva.id})"><i class="bi bi-star"></i> Avaliar Espaço</button>`;
    }

    // Quando o proprietário recusa/cancela, ele escreve uma justificativa
    // (ver abrirModalMotivoRecusa() em reservas-dono.js) - escaparHtml()
    // evita que esse texto (escrito por outra pessoa) vire HTML de
    // verdade na página de quem está lendo.
    const avisoRecusa = (status === 'Cancelado' && reserva.motivo_recusa)
        ? `<p class="aviso-motivo-recusa"><i class="bi bi-info-circle"></i> <span><strong>Motivo:</strong> ${escaparHtml(reserva.motivo_recusa)}</span></p>`
        : '';

    return `
        <div class="card-reserva">
            <div>
                <div class="card-reserva-header">
                    <h3>${reserva.espaco_nome}</h3>
                    <span class="status-tag ${classeStatus}">${status}</span>
                </div>

                <div class="card-reserva-corpo">
                    <p><i class="bi bi-calendar4-event"></i> Data: <strong>${formatarData(reserva.data)}</strong></p>
                    <p><i class="bi bi-clock"></i> Horário: <strong>${formatarHorarioReserva(reserva)}</strong></p>
                    <p><i class="bi bi-award"></i> Evento: <strong>${reserva.tipo_evento || '-'}</strong></p>
                    <p><i class="bi bi-people"></i> Convidados: <strong>${reserva.convidados || '-'} pessoas</strong></p>
                    <p><i class="bi bi-telephone"></i> Contato: <strong>${reserva.telefone || '-'}</strong></p>

                    ${avisoRecusa}
                </div>
            </div>

            ${botaoAvaliacao}
        </div>
    `;
}

/* ==========================================================================
   MODAL DE AVALIAÇÃO
   ========================================================================== */
let reservaEmAvaliacaoId = null;

function abrirModalAvaliacao(idReserva) {
    reservaEmAvaliacaoId = idReserva;
    document.getElementById('form-avaliacao').reset();
    document.getElementById('modal-avaliacao').classList.add('ativo');
}

function fecharModalAvaliacao() {
    document.getElementById('modal-avaliacao').classList.remove('ativo');
    reservaEmAvaliacaoId = null;
}

// Fecha o modal ao clicar fora dele (no overlay escuro), mesmo padrão usado
// nos outros modais do site (ver modais.js)
window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('modal-avaliacao')) {
        fecharModalAvaliacao();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-avaliacao');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nota = document.getElementById('avaliacao-nota').value;
        const comentario = document.getElementById('avaliacao-comentario').value;

        try {
            await chamarAPI(`/api/reservas/${reservaEmAvaliacaoId}/avaliacao`, {
                method: 'POST',
                body: JSON.stringify({ nota: Number(nota), comentario })
            });

            fecharModalAvaliacao();
            alert('Obrigado! Sua avaliação foi enviada.');
            carregarHistorico(); // recarrega os cards - o botão vira "Você já avaliou"
        } catch (erro) {
            alert(erro.message);
        }
    });
});

// Converte a data do formato guardado no banco (AAAA-MM-DD) para o formato
// brasileiro DD/MM/AAAA, só pra exibição
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
