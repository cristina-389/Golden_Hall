/* ==========================================================================
   GOLDEN HALL - SOLICITAÇÕES DE RESERVA DE UM ESPAÇO, PRO DONO
   (paginas/dono/solicitacoes-espaco.html)
   Lê o "?id=..." da URL (a página de Reservas manda pra cá com o id certo)
   e mostra só as reservas ATIVAS daquele espaço - Pendente (com
   Aprovar/Recusar) ou Aprovada com o evento ainda por acontecer (com
   Cancelar). Reserva Cancelada, ou Aprovada já realizada, não aparece mais
   aqui - misturava reservas que já foram decididas com as que ainda
   precisavam de atenção, dificultando ver qual solicitação era a de
   verdade. O retrospecto completo (com tudo, de qualquer status) mora na
   página de histórico do espaço (historico-espaco.html).
   ========================================================================== */

let idEspacoAtual = null;
let nomeEspacoAtual = ''; // usado em montarResumoReserva() (global.js), pro botão de compartilhar

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    idEspacoAtual = new URLSearchParams(window.location.search).get('id');
    if (!idEspacoAtual) {
        window.location.href = '/frontend/paginas/dono/reservas-dono.html';
        return;
    }

    // GET /api/espacos/:id/reservas não devolve o nome do espaço (só as
    // reservas) - busca em GET /api/meus-espacos, que já é rápida e o dono
    // normalmente tem poucos espaços cadastrados
    try {
        const meusEspacos = await chamarAPI('/api/meus-espacos');
        const espaco = meusEspacos.find(item => String(item.id) === String(idEspacoAtual));

        if (!espaco) {
            alert('Não foi possível encontrar esse espaço.');
            window.location.href = '/frontend/paginas/dono/reservas-dono.html';
            return;
        }

        nomeEspacoAtual = espaco.nome;
        document.getElementById('titulo-espaco-solicitacoes').textContent = espaco.nome;
        document.title = 'Solicitações de ' + espaco.nome + ' | Golden Hall';
    } catch (erro) {
        console.error('Erro ao buscar o nome do espaço:', erro);
    }

    carregarSolicitacoes();
});

async function carregarSolicitacoes() {
    const container = document.getElementById('lista-solicitacoes-espaco');
    container.innerHTML = '<p>Carregando...</p>';

    let reservas = [];
    try {
        reservas = await chamarAPI(`/api/espacos/${idEspacoAtual}/reservas`);
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
        return;
    }

    // Data de hoje no mesmo formato "AAAA-MM-DD" salvo nas reservas, pra
    // comparar como texto - só entram aqui as Pendentes e as Aprovadas
    // ainda por acontecer (mesmo critério de "reserva ativa" usado em
    // reservas.js/historico.js, do lado do cliente)
    const hoje = new Date();
    const hojeString = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const reservasAtivas = reservas.filter(reserva => ehReservaAtiva(reserva, hojeString));

    if (reservasAtivas.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio-painel">
                <i class="bi bi-envelope-paper-fill"></i>
                <p>Nenhuma solicitação esperando atenção agora neste espaço.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    reservasAtivas.forEach(reserva => container.appendChild(criarLinhaReserva(reserva)));
}

function ehReservaAtiva(reserva, hojeString) {
    if (reserva.status === 'Pendente') return true;
    if (reserva.status === 'Aprovado') return reserva.data > hojeString;
    return false;
}

// Monta um card com os dados de uma reserva ativa. Se ela ainda estiver
// "Pendente", mostra os botões de Aprovar/Recusar; se já estiver Aprovada
// (com o evento ainda por acontecer), mostra o botão de Cancelar.
function criarLinhaReserva(reserva) {
    const [ano, mes, dia] = reserva.data.split('-');
    const classeStatus = reserva.status === 'Aprovado' ? 'status-aprovado' : 'status-pendente';

    // Reserva já Aprovada: o contato fica sempre em destaque (mesma caixa
    // dourada que aparece na hora de aprovar) - o proprietário pode voltar
    // aqui quantas vezes quiser pra ver o WhatsApp/e-mail do cliente, não
    // é um aviso que só aparece uma vez. Pendente ainda não tem decisão
    // tomada, então o contato fica só como um texto simples mesmo.
    const blocoContato = reserva.status === 'Aprovado'
        ? `
            <p class="rotulo-contato-cliente"><i class="bi bi-person-lines-fill"></i> Contato do cliente</p>
            <div class="card-aviso-email"><i class="bi bi-telephone-fill"></i><span>${reserva.telefone || 'Telefone não informado'}</span></div>
            <div class="card-aviso-email"><i class="bi bi-envelope-fill"></i><span class="email-cliente"></span></div>
            <button type="button" class="btn-compartilhar-reserva">
                <i class="bi bi-share-fill"></i> Compartilhar dados da reserva
            </button>
          `
        : `
            <p><i class="bi bi-telephone"></i> Contato: <strong>${reserva.telefone || '-'}</strong></p>
            <p><i class="bi bi-envelope"></i> E-mail: <strong class="email-cliente"></strong></p>
          `;

    const div = document.createElement('div');
    div.className = 'card-reserva';
    div.innerHTML = `
        <div class="conteudo-linha-reserva">
            <div class="card-reserva-header">
                <h3 class="nome-cliente"></h3>
                <span class="status-tag ${classeStatus}">${reserva.status}</span>
            </div>
            <div class="card-reserva-corpo">
                <p><i class="bi bi-calendar4-event"></i> Data: <strong>${dia}/${mes}/${ano}</strong></p>
                <p><i class="bi bi-clock"></i> Horário: <strong>${formatarHorarioReserva(reserva)}</strong></p>
                <p><i class="bi bi-award"></i> Evento: <strong>${reserva.tipo_evento || '-'}</strong></p>
                <p><i class="bi bi-people"></i> Convidados: <strong>${reserva.convidados || '-'}</strong></p>
                <p class="observacoes-reserva"><i class="bi bi-chat-left-text"></i> Observações: <strong class="observacoes-cliente"></strong></p>
                ${blocoContato}
            </div>
        </div>
    `;

    div.querySelector('.nome-cliente').textContent = reserva.cliente_nome;
    div.querySelector('.email-cliente').textContent = reserva.cliente_email;
    div.querySelector('.observacoes-cliente').textContent = reserva.observacoes || 'Nenhuma';

    const btnCompartilhar = div.querySelector('.btn-compartilhar-reserva');
    if (btnCompartilhar) {
        btnCompartilhar.addEventListener('click', () => {
            compartilharOuCopiar(montarResumoReserva(reserva, nomeEspacoAtual), btnCompartilhar);
        });
    }

    if (reserva.status === 'Pendente') {
        const botoes = document.createElement('div');
        botoes.className = 'botoes-alerta-grupo';
        botoes.style.marginTop = '15px';

        const btnAprovar = document.createElement('button');
        btnAprovar.className = 'btn-confirmar-alerta';
        btnAprovar.textContent = 'Aprovar';
        btnAprovar.addEventListener('click', () => aprovarReserva(reserva, div));

        const btnRecusar = document.createElement('button');
        btnRecusar.className = 'btn-cancelar-alerta';
        btnRecusar.textContent = 'Recusar';
        btnRecusar.addEventListener('click', () => abrirModalMotivoRecusa(
            reserva.id,
            div,
            'Conte rapidamente por que essa solicitação não pôde ser aceita - o cliente vai ver esse motivo em "Minhas Reservas".'
        ));

        botoes.appendChild(btnRecusar);
        botoes.appendChild(btnAprovar);
        div.querySelector('.conteudo-linha-reserva').appendChild(botoes);
    } else if (reserva.status === 'Aprovado') {
        // Reserva já aprovada também pode ser cancelada depois (ex: o
        // proprietário precisa liberar a data). Pede confirmação extra
        // porque, diferente de recusar uma reserva ainda Pendente, aqui a
        // pessoa já contava com a data confirmada - e a data fica livre pra
        // outra pessoa reservar IMEDIATAMENTE (ver GET
        // /api/espacos/:slug/datas-ocupadas), então cancelar muito perto da
        // data do evento pode fazer o proprietário perder esse dia, sem
        // tempo de conseguir outra reserva.
        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'btn-cancelar-alerta';
        btnCancelar.style.marginTop = '15px';
        btnCancelar.style.width = '100%';
        btnCancelar.textContent = 'Cancelar reserva';
        btnCancelar.addEventListener('click', () => abrirModalMotivoRecusa(
            reserva.id,
            div,
            'Cancelar esta reserva já aprovada? A pessoa perde a reserva confirmada e a data fica livre imediatamente ' +
            'pra qualquer outra pessoa reservar. Quanto mais perto da data do evento, menor a chance de conseguir uma ' +
            'reserva nova pra esse dia. Conte o motivo do cancelamento - o cliente vai ver essa mensagem.'
        ));
        div.querySelector('.conteudo-linha-reserva').appendChild(btnCancelar);
    }

    return div;
}

// Aprova a reserva e, se der certo, troca o conteúdo do card por uma tela
// de sucesso com o contato do cliente (telefone/WhatsApp e e-mail), pra o
// proprietário já saber como combinar os detalhes do evento.
async function aprovarReserva(reserva, divCard) {
    try {
        await chamarAPI(`/api/reservas/${reserva.id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Aprovado' })
        });

        divCard.innerHTML = `
            <div class="sucesso-aprovacao-reserva">
                <i class="bi bi-check-circle-fill icone-sucesso-dourado"></i>
                <h3>Reserva aprovada!</h3>
                <p>Entre em contato com <strong>${reserva.cliente_nome}</strong> pra combinar os detalhes do evento:</p>
                <div class="card-aviso-email"><i class="bi bi-telephone-fill"></i><span>${reserva.telefone || 'Telefone não informado'}</span></div>
                <div class="card-aviso-email"><i class="bi bi-envelope-fill"></i><span>${reserva.cliente_email}</span></div>
                <button type="button" class="btn-compartilhar-reserva">
                    <i class="bi bi-share-fill"></i> Compartilhar dados da reserva
                </button>
            </div>
        `;

        divCard.querySelector('.btn-compartilhar-reserva').addEventListener('click', (event) => {
            compartilharOuCopiar(montarResumoReserva(reserva, nomeEspacoAtual), event.currentTarget);
        });
    } catch (erro) {
        alert(erro.message);
    }
}

async function recusarReserva(idReserva, divCard, motivo) {
    try {
        await chamarAPI(`/api/reservas/${idReserva}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Cancelado', motivo })
        });

        // Reserva Cancelada não é mais "ativa" - some da lista (o cliente é
        // avisado por notificação, e o retrospecto completo fica no
        // histórico do espaço, não aqui)
        const container = document.getElementById('lista-solicitacoes-espaco');
        divCard.remove();

        if (!container.querySelector('.card-reserva')) {
            container.innerHTML = `
                <div class="estado-vazio-painel">
                    <i class="bi bi-envelope-paper-fill"></i>
                    <p>Nenhuma solicitação esperando atenção agora neste espaço.</p>
                </div>
            `;
        }
    } catch (erro) {
        alert(erro.message);
    }
}

/* ==========================================================================
   MODAL: MOTIVO DA RECUSA/CANCELAMENTO
   Aberto tanto ao "Recusar" uma reserva Pendente quanto ao "Cancelar" uma
   já Aprovada - guarda pra qual reserva/card é, e só chama recusarReserva()
   de verdade depois que a pessoa escrever a justificativa e confirmar.
   ========================================================================== */
let contextoMotivoRecusa = null; // { idReserva, divCard }

function abrirModalMotivoRecusa(idReserva, divCard, aviso) {
    contextoMotivoRecusa = { idReserva, divCard };
    document.getElementById('aviso-motivo-recusa').textContent = aviso;
    document.getElementById('input-motivo-recusa').value = '';
    document.getElementById('modal-motivo-recusa').classList.add('ativo');
}

function fecharModalMotivoRecusa() {
    document.getElementById('modal-motivo-recusa').classList.remove('ativo');
    contextoMotivoRecusa = null;
}

// Ligado ao "onsubmit" do formulário - "return false" sempre, pra nunca
// deixar o formulário recarregar a página de verdade
function confirmarRecusaComMotivo(event) {
    event.preventDefault();

    const motivo = document.getElementById('input-motivo-recusa').value.trim();
    if (!motivo) {
        alert('Escreva uma breve justificativa antes de confirmar.');
        return false;
    }

    const { idReserva, divCard } = contextoMotivoRecusa;
    document.getElementById('modal-motivo-recusa').classList.remove('ativo');
    recusarReserva(idReserva, divCard, motivo);

    return false;
}

// Fecha o modal desta página ao clicar fora da caixa (mesmo padrão dos
// outros modais do site)
window.addEventListener('click', function (event) {
    const modalMotivoRecusa = document.getElementById('modal-motivo-recusa');
    if (event.target === modalMotivoRecusa) fecharModalMotivoRecusa();
});
