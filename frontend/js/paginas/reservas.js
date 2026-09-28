/* ==========================================================================
   GOLDEN HALL - PÁGINA "MINHAS RESERVAS"
   Busca as reservas de quem está logado em GET /api/minhas-reservas (a API
   já devolve o nome do espaço junto, graças ao JOIN feito no back-end) e
   desenha um card para cada uma.
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
                <a href="/frontend/paginas/cliente/buscar.html" class="btn-novo-espaco"><i class="bi bi-search"></i> Explorar Espaços Disponíveis</a>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    // Data de hoje no mesmo formato "AAAA-MM-DD" salvo nas reservas, pra
    // comparar como texto - só dá pra avaliar DEPOIS que o evento aconteceu
    // (mesma regra aplicada no back-end, em POST /api/reservas/:id/avaliacao)
    const hoje = new Date();
    const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    reservas.forEach((reserva) => {
        const status = reserva.status || 'Pendente';
        const classeStatus = status.toLowerCase() === 'aprovado'
            ? 'status-aprovado'
            : (status.toLowerCase() === 'cancelado' ? 'status-cancelado' : 'status-pendente');

        // Só reservas já Aprovadas, com o evento já realizado, podem ser
        // avaliadas - e só uma vez (ver routes/reservas.js). "avaliado" vem
        // pronto da API (LEFT JOIN avaliacoes em GET /api/minhas-reservas).
        let botaoAvaliacao = '';
        if (status === 'Aprovado') {
            if (reserva.avaliado) {
                botaoAvaliacao = `<span class="ja-avaliado"><i class="bi bi-star-fill"></i> Você já avaliou este espaço</span>`;
            } else if (reserva.data <= hojeString) {
                botaoAvaliacao = `<button class="btn-avaliar-reserva" onclick="abrirModalAvaliacao(${reserva.id})"><i class="bi bi-star"></i> Avaliar Espaço</button>`;
            } else {
                botaoAvaliacao = `<span class="aviso-avaliacao-futura"><i class="bi bi-hourglass-split"></i> Você poderá avaliar depois que o evento acontecer</span>`;
            }
        }

        // Quando o proprietário recusa/cancela, ele escreve uma justificativa
        // (ver abrirModalMotivoRecusa() em reservas-dono.js) - escaparHtml()
        // evita que esse texto (escrito por outra pessoa) vire HTML de
        // verdade na página de quem está lendo.
        const avisoRecusa = (status === 'Cancelado' && reserva.motivo_recusa)
            ? `<p class="aviso-motivo-recusa"><i class="bi bi-info-circle"></i> <span><strong>Motivo:</strong> ${escaparHtml(reserva.motivo_recusa)}</span></p>`
            : '';

        const cardHTML = `
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

                ${botaoAvaliacao}

                ${status !== 'Cancelado' ? `
                <button class="btn-cancelar-reserva" onclick="cancelarReserva(${reserva.id})">
                    <i class="bi bi-trash"></i> Cancelar Reserva
                </button>` : ''}
            </div>
        `;

        container.innerHTML += cardHTML;
    });
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
            carregarMinhasReservas(); // recarrega os cards - o botão vira "Você já avaliou"
        } catch (erro) {
            alert(erro.message);
        }
    });
});

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

// Botão "Cancelar Reserva" de um card: confirma com a pessoa e só chama a
// API (DELETE /api/reservas/:id) se ela confirmar no alerta. Quem decide de
// verdade se pode cancelar é o back-end (só o dono da reserva consegue, ver
// routes/reservas.js).
async function cancelarReserva(idReserva) {
    if (!confirm('Deseja realmente cancelar esta reserva? O cancelamento é gratuito.')) return;

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
