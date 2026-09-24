/* ==========================================================================
   GOLDEN HALL - SOLICITAÇÕES DE RESERVA DO DONO (paginas/dono/reservas-dono.html)
   Página exclusiva pra contas "proprietario": lista os espaços dele (um
   card comprido por espaço, com aviso de quantas reservas estão pendentes)
   e, ao clicar em "Ver solicitações", mostra as reservas daquele espaço com
   os botões de Aprovar/Recusar/Cancelar - mesma lógica que já existia no
   modal de painel-dono.html, só que agora com página própria e uma
   animação de sucesso ao aprovar, mostrando o contato do cliente.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    carregarEspacosComReservas();
});

// Guarda a última lista de espaços buscada, pra reaproveitar no seletor de
// avaliações sem precisar pedir de novo pra API
let espacosCache = [];

/* ==========================================================================
   LISTA DE ESPAÇOS (um card comprido por espaço)
   ========================================================================== */
async function carregarEspacosComReservas() {
    const container = document.getElementById('lista-espacos-reservas');

    try {
        espacosCache = await chamarAPI('/api/meus-espacos');
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
        return;
    }

    if (espacosCache.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio-painel">
                <i class="bi bi-envelope-paper-fill"></i>
                <p>Você ainda não tem espaços cadastrados.</p>
                <a class="btn btn-gold" href="/frontend/paginas/dono/painel-dono.html">Cadastrar meu primeiro espaço</a>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    espacosCache.forEach(espaco => container.appendChild(criarCardEspacoReservas(espaco)));
}

function criarCardEspacoReservas(espaco) {
    const card = document.createElement('div');
    card.className = 'card-espaco-reservas';

    const temPendencia = espaco.reservas_pendentes > 0;
    const textoPendencia = espaco.reservas_pendentes === 1
        ? '1 solicitação pendente'
        : `${espaco.reservas_pendentes} solicitações pendentes`;

    card.innerHTML = `
        <div class="info-espaco-reservas">
            <h3></h3>
            <p><i class="bi bi-geo-alt"></i> <span class="texto-local"></span></p>
        </div>
        <div class="acao-espaco-reservas">
            ${temPendencia ? `<span class="badge-pendencia-reservas">${textoPendencia}</span>` : ''}
            <button class="btn btn-gold btn-ver-solicitacoes">
                <i class="bi bi-envelope-paper-fill"></i> Ver solicitações de reserva
            </button>
        </div>
    `;

    card.querySelector('h3').textContent = espaco.nome;
    card.querySelector('.texto-local').textContent = espaco.local || 'Local a definir';
    card.querySelector('.btn-ver-solicitacoes').addEventListener('click', () => abrirReservasEspaco(espaco));

    return card;
}

/* ==========================================================================
   MODAL: SOLICITAÇÕES DE RESERVA DE UM ESPAÇO
   ========================================================================== */
async function abrirReservasEspaco(espaco) {
    const container = document.getElementById('lista-reservas-espaco');
    document.getElementById('titulo-reservas-espaco').textContent = 'Reservas de "' + espaco.nome + '"';
    container.innerHTML = '<p>Carregando...</p>';
    document.getElementById('modal-reservas-espaco').classList.add('ativo');

    let reservas = [];
    try {
        reservas = await chamarAPI(`/api/espacos/${espaco.id}/reservas`);
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
        return;
    }

    if (reservas.length === 0) {
        container.innerHTML = '<p>Nenhuma reserva recebida ainda para este espaço.</p>';
        return;
    }

    container.innerHTML = '';
    reservas.forEach(reserva => container.appendChild(criarLinhaReserva(reserva)));
}

function fecharReservasEspaco() {
    document.getElementById('modal-reservas-espaco').classList.remove('ativo');
    carregarEspacosComReservas(); // atualiza os avisos de pendência dos cards
}

// Monta um card com os dados de uma reserva recebida. Se ela ainda estiver
// "Pendente", mostra os botões de Aprovar/Recusar; reservas já Aprovadas ou
// Canceladas só ficam visíveis, sem ação (decisão já foi tomada) - exceto
// Aprovada, que ainda pode ser cancelada depois (ver mais abaixo).
function criarLinhaReserva(reserva) {
    const [ano, mes, dia] = reserva.data.split('-');
    const classeStatus = reserva.status === 'Aprovado' ? 'status-aprovado' : 'status-pendente';

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
                <p><i class="bi bi-telephone"></i> Contato: <strong>${reserva.telefone || '-'}</strong></p>
                <p><i class="bi bi-envelope"></i> E-mail: <strong class="email-cliente"></strong></p>
            </div>
        </div>
    `;

    div.querySelector('.nome-cliente').textContent = reserva.cliente_nome;
    div.querySelector('.email-cliente').textContent = reserva.cliente_email;

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
        btnRecusar.addEventListener('click', () => recusarReserva(reserva.id, div));

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
        btnCancelar.addEventListener('click', () => {
            const certeza = confirm(
                'Cancelar esta reserva já aprovada? A pessoa perde a reserva confirmada e a data fica livre ' +
                'imediatamente pra qualquer outra pessoa reservar. Quanto mais perto da data do evento, menor a ' +
                'chance de conseguir uma reserva nova pra esse dia.'
            );
            if (certeza) recusarReserva(reserva.id, div);
        });
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
            </div>
        `;

        carregarEspacosComReservas(); // atualiza o aviso de pendência do card do espaço, sem fechar o modal
    } catch (erro) {
        alert(erro.message);
    }
}

async function recusarReserva(idReserva, divCard) {
    try {
        const reservaAtualizada = await chamarAPI(`/api/reservas/${idReserva}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Cancelado' })
        });

        // Redesenha só esse card, já sem os botões de ação (Cancelado não
        // tem mais nada a fazer) - o resto da lista continua como estava
        const cardAtualizado = criarLinhaReserva({
            ...reservaAtualizada,
            cliente_nome: divCard.querySelector('.nome-cliente').textContent,
            cliente_email: divCard.querySelector('.email-cliente').textContent
        });
        divCard.replaceWith(cardAtualizado);

        carregarEspacosComReservas(); // atualiza o aviso de pendência do card do espaço
    } catch (erro) {
        alert(erro.message);
    }
}

/* ==========================================================================
   AVALIAÇÕES - botão geral que, se tiver mais de um espaço, pergunta qual
   deles o dono quer ver antes de abrir a página de avaliações.
   ========================================================================== */
function abrirEscolhaAvaliacoes() {
    if (espacosCache.length === 0) {
        alert('Você ainda não tem espaços cadastrados.');
        return;
    }

    if (espacosCache.length === 1) {
        window.location.href = `/frontend/paginas/dono/avaliacoes-espaco.html?slug=${espacosCache[0].slug}`;
        return;
    }

    const lista = document.getElementById('lista-escolher-espaco-avaliacoes');
    lista.innerHTML = '';
    espacosCache.forEach(espaco => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn-ajuste btn-bloco btn-escolher-espaco-avaliacao';
        botao.textContent = espaco.nome;
        botao.addEventListener('click', () => {
            window.location.href = `/frontend/paginas/dono/avaliacoes-espaco.html?slug=${espaco.slug}`;
        });
        lista.appendChild(botao);
    });

    document.getElementById('modal-escolher-espaco-avaliacoes').classList.add('ativo');
}

function fecharEscolhaAvaliacoes() {
    document.getElementById('modal-escolher-espaco-avaliacoes').classList.remove('ativo');
}

// Fecha os modais desta página ao clicar fora da caixa (mesmo padrão dos
// outros modais do site)
window.addEventListener('click', function (event) {
    const modalReservasEspaco = document.getElementById('modal-reservas-espaco');
    const modalEscolherEspaco = document.getElementById('modal-escolher-espaco-avaliacoes');

    if (event.target === modalReservasEspaco) fecharReservasEspaco();
    if (event.target === modalEscolherEspaco) fecharEscolhaAvaliacoes();
});
