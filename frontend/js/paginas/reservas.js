/* ==========================================================================
   GOLDEN HALL - PÁGINA "MINHAS RESERVAS" (só as reservas ATIVAS)
   Busca as reservas de quem está logado em GET /api/minhas-reservas (a API
   já devolve o nome do espaço junto, graças ao JOIN feito no back-end) e
   desenha um card só pras que ainda estão em andamento - uma reserva some
   daqui e vai pro histórico (paginas/cliente/historico.html) assim que o
   evento é realizado (Aprovado com a data já passada) ou assim que a
   pessoa fica ciente de um cancelamento (dela mesma ou do proprietário) -
   ver ehReservaAtiva() logo abaixo.
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

    // Data de hoje no mesmo formato "AAAA-MM-DD" salvo nas reservas, pra
    // comparar como texto
    const hoje = new Date();
    const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const reservasAtivas = reservas.filter(reserva => ehReservaAtiva(reserva, hojeString));

    // Atualiza os contadores no topo da tela com base só no que está sendo mostrado aqui
    atualizarEstatisticas(reservasAtivas);

    if (reservasAtivas.length === 0) {
        container.innerHTML = reservas.length === 0
            ? `
                <div class="reservas-vazias">
                    <i class="bi bi-calendar-x"></i>
                    <p>Você ainda não possui nenhuma reserva realizada no Golden Hall.</p>
                    <a href="/frontend/paginas/cliente/buscar.html" class="btn-novo-espaco"><i class="bi bi-search"></i> Explorar Espaços Disponíveis</a>
                </div>
            `
            : `
                <div class="reservas-vazias">
                    <i class="bi bi-calendar-check"></i>
                    <p>Você não tem nenhuma reserva em andamento agora.</p>
                    <a href="/frontend/paginas/cliente/historico.html" class="btn-novo-espaco"><i class="bi bi-clock-history"></i> Ver histórico de reservas</a>
                </div>
            `;
        return;
    }

    container.innerHTML = '';
    reservasAtivas.forEach(reserva => {
        container.innerHTML += criarCardReservaAtiva(reserva);
    });
}

// Uma reserva fica "ativa" (aparece aqui) enquanto: ainda está Pendente; ou
// já foi Aprovada mas o evento ainda não aconteceu; ou acabou de ser
// Cancelada (pela pessoa ou pelo proprietário) e ela ainda não abriu essa
// página pra ver o aviso - "visto_pelo_cliente" vem da API e só vira 1
// depois que GET /api/minhas-reservas já respondeu uma vez com ela em 0
// (ver routes/reservas.js). Reserva Aprovada com o evento já realizado, ou
// Cancelada já vista, vivem só no histórico (historico.js).
function ehReservaAtiva(reserva, hojeString) {
    const status = reserva.status || 'Pendente';

    if (status === 'Pendente') return true;
    if (status === 'Aprovado') return reserva.data > hojeString;
    if (status === 'Cancelado') return !reserva.visto_pelo_cliente;

    return false;
}

function criarCardReservaAtiva(reserva) {
    const status = reserva.status || 'Pendente';
    const classeStatus = status.toLowerCase() === 'aprovado'
        ? 'status-aprovado'
        : (status.toLowerCase() === 'cancelado' ? 'status-cancelado' : 'status-pendente');

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

                    ${status !== 'Cancelado' ? `
                    <p class="aviso-prazo-cancelamento">
                    <i class="bi bi-shield-check"></i>
                    <span>Cancelamento gratuito a qualquer momento.</span>
                    </p>` : ''}
                </div>
            </div>

            ${status !== 'Cancelado' ? `
            <button class="btn-cancelar-reserva" onclick="cancelarReserva(${reserva.id}, '${status}')">
                <i class="bi bi-trash"></i> Cancelar Reserva
            </button>` : ''}
        </div>
    `;
}

// Preenche os números do painel no topo da página (total de reservas ativas,
// quantas estão pendentes e quantas já foram aprovadas)
function atualizarEstatisticas(reservasAtivas) {
    const totalEl = document.getElementById('stat-total');
    const pendentesEl = document.getElementById('stat-pendentes');
    const aprovadasEl = document.getElementById('stat-aprovadas');

    if (!totalEl || !pendentesEl || !aprovadasEl) return;

    const total = reservasAtivas.length;
    const pendentes = reservasAtivas.filter(r => (r.status || 'Pendente').toLowerCase() === 'pendente').length;
    const aprovadas = reservasAtivas.filter(r => (r.status || '').toLowerCase() === 'aprovado').length;

    totalEl.textContent = total;
    pendentesEl.textContent = pendentes;
    aprovadasEl.textContent = aprovadas;
}

// Botão "Cancelar Reserva" de um card. Uma reserva ainda Pendente cancela
// direto (o proprietário nem tinha aprovado nada ainda) - só pede
// confirmação simples. Uma já Aprovada exige uma justificativa (o
// proprietário já tinha essa data reservada de verdade, então precisa saber
// o motivo - ver abrirModalMotivoCancelamento() logo abaixo).
async function cancelarReserva(idReserva, status) {
    if (status === 'Aprovado') {
        abrirModalMotivoCancelamento(idReserva);
        return;
    }

    if (!confirm('Deseja realmente cancelar esta reserva? O cancelamento é gratuito.')) return;
    await enviarCancelamento(idReserva, null);
}

// Chama de verdade a API (DELETE /api/reservas/:id) - quem decide se pode
// cancelar (e se o motivo é obrigatório) é o back-end, ver routes/reservas.js.
async function enviarCancelamento(idReserva, motivo) {
    try {
        await chamarAPI(`/api/reservas/${idReserva}`, {
            method: 'DELETE',
            body: JSON.stringify({ motivo })
        });
        alert('Sua reserva foi cancelada com sucesso!');
        carregarMinhasReservas(); // recarrega os cards e contadores na tela
    } catch (erro) {
        alert('Não foi possível cancelar: ' + erro.message);
    }
}

/* ==========================================================================
   MODAL: MOTIVO DO CANCELAMENTO (só pra reservas já Aprovadas)
   Mesma ideia do motivo que o proprietário escreve ao recusar/cancelar (ver
   abrirModalMotivoRecusa() em solicitacoes-espaco.js), só que aqui é o
   cliente explicando pro proprietário.
   ========================================================================== */
let idReservaEmCancelamento = null;

function abrirModalMotivoCancelamento(idReserva) {
    idReservaEmCancelamento = idReserva;
    document.getElementById('input-motivo-cancelamento').value = '';
    document.getElementById('modal-motivo-cancelamento').classList.add('ativo');
}

function fecharModalMotivoCancelamento() {
    document.getElementById('modal-motivo-cancelamento').classList.remove('ativo');
    idReservaEmCancelamento = null;
}

// Ligado ao "onsubmit" do formulário - "return false" sempre, pra nunca
// deixar o formulário recarregar a página de verdade
function confirmarCancelamentoComMotivo(event) {
    event.preventDefault();

    const motivo = document.getElementById('input-motivo-cancelamento').value.trim();
    if (!motivo) {
        alert('Escreva uma breve justificativa antes de confirmar.');
        return false;
    }

    const idReserva = idReservaEmCancelamento;
    document.getElementById('modal-motivo-cancelamento').classList.remove('ativo');
    enviarCancelamento(idReserva, motivo);

    return false;
}

// Fecha o modal ao clicar fora da caixa (mesmo padrão dos outros modais do site)
window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('modal-motivo-cancelamento')) {
        fecharModalMotivoCancelamento();
    }
});

// Converte a data do formato guardado no banco (AAAA-MM-DD, o padrão de
// <input type="date">) para o formato brasileiro DD/MM/AAAA, só pra exibição
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
