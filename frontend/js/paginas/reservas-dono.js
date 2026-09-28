/* ==========================================================================
   GOLDEN HALL - SOLICITAÇÕES DE RESERVA DO DONO (paginas/dono/reservas-dono.html)
   Página exclusiva pra contas "proprietario": um resumo lá em cima
   (pendências, avaliações recebidas e a próxima reserva confirmada) e,
   embaixo, um card comprido por espaço que já recebeu pelo menos uma
   reserva, com foto e aviso de quantas estão pendentes. "Ver solicitações"
   leva pra uma página própria (solicitacoes-espaco.html) com os botões de
   Aprovar/Recusar/Cancelar. "Ver avaliações"/"Ver histórico" levam pras
   páginas dedicadas de cada espaço (avaliacoes-espaco.html e
   historico-espaco.html).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    carregarEspacosComReservas();
    carregarResumoReservas();
});

// Guarda a última lista de espaços buscada (TODOS, mesmo sem reserva), pra
// reaproveitar no seletor de avaliações/histórico sem precisar pedir de
// novo pra API
let espacosCache = [];

/* ==========================================================================
   RESUMO DAS RESERVAS (pendências, avaliações e a próxima reserva confirmada)
   ========================================================================== */
async function carregarResumoReservas() {
    try {
        const estatisticas = await chamarAPI('/api/estatisticas-dono');

        document.getElementById('stat-pendentes-geral').textContent = estatisticas.reservas_pendentes;
        document.getElementById('stat-reservas-realizadas').textContent = estatisticas.reservas_realizadas;
        document.getElementById('stat-total-avaliacoes').textContent = estatisticas.total_avaliacoes;

        atualizarCardProximaReserva(estatisticas.proximas_reservas || []);
    } catch (erro) {
        console.error('Erro ao carregar o resumo das reservas:', erro);
    }
}

// Guarda a lista completa pra alimentar o modal quando a pessoa clicar
let proximasReservasCache = [];

// Com nenhuma reserva futura, fica só o lembrete de sempre. Com exatamente
// 1, mostra a data e o espaço direto (como sempre foi). Com mais de 1, o
// card passa a mostrar a quantidade e vira clicável, abrindo um modal com a
// lista completa como lembrete.
function atualizarCardProximaReserva(proximasReservas) {
    proximasReservasCache = proximasReservas;

    const card = document.getElementById('card-proxima-reserva');
    const campoProxima = document.getElementById('stat-proxima-reserva');

    card.classList.remove('card-estatistica-clicavel');
    card.onclick = null;

    if (proximasReservas.length === 0) {
        campoProxima.textContent = 'Nenhuma por enquanto';
    } else if (proximasReservas.length === 1) {
        const [ano, mes, dia] = proximasReservas[0].data.split('-');
        campoProxima.textContent = `${dia}/${mes} · ${proximasReservas[0].espaco_nome}`;
    } else {
        campoProxima.textContent = `${proximasReservas.length} reservas por acontecer`;
        card.classList.add('card-estatistica-clicavel');
        card.onclick = abrirProximasReservas;
    }
}

function abrirProximasReservas() {
    const lista = document.getElementById('lista-proximas-reservas');
    lista.innerHTML = '';

    proximasReservasCache.forEach(reserva => {
        const [ano, mes, dia] = reserva.data.split('-');
        const item = document.createElement('div');
        item.className = 'item-proxima-reserva';
        item.innerHTML = `
            <i class="bi bi-calendar-heart-fill"></i>
            <div>
                <strong>${dia}/${mes}/${ano}</strong>
                <span>${formatarHorarioReserva(reserva)} · ${reserva.espaco_nome}</span>
            </div>
        `;
        lista.appendChild(item);
    });

    document.getElementById('modal-proximas-reservas').classList.add('ativo');
}

function fecharProximasReservas() {
    document.getElementById('modal-proximas-reservas').classList.remove('ativo');
}

/* ==========================================================================
   LISTA DE ESPAÇOS (um card comprido por espaço que já tem reserva)
   ========================================================================== */
async function carregarEspacosComReservas() {
    const container = document.getElementById('lista-espacos-reservas');

    try {
        espacosCache = await chamarAPI('/api/meus-espacos');
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
        return;
    }

    // Só entram nessa lista os espaços que já receberam pelo menos uma
    // solicitação de reserva (em qualquer status) - espaço sem reserva
    // nenhuma não tem o que mostrar em "Ver solicitações", então nem
    // aparece aqui
    const espacosComReserva = espacosCache.filter(espaco => espaco.total_reservas > 0);

    if (espacosComReserva.length === 0) {
        container.innerHTML = `
            <div class="estado-vazio-painel">
                <i class="bi bi-envelope-paper-fill"></i>
                <p>Nenhum dos seus espaços recebeu uma solicitação de reserva ainda.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    espacosComReserva.forEach(espaco => container.appendChild(criarCardEspacoReservas(espaco)));
}

function criarCardEspacoReservas(espaco) {
    const imagem = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop';

    const card = document.createElement('div');
    card.className = 'card-espaco-reservas';

    const temPendencia = espaco.reservas_pendentes > 0;
    const textoPendencia = espaco.reservas_pendentes === 1
        ? '1 solicitação pendente'
        : `${espaco.reservas_pendentes} solicitações pendentes`;

    card.innerHTML = `
        <div class="foto-espaco-reservas">
            <img src="${imagem}" alt="">
        </div>
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
    card.querySelector('.btn-ver-solicitacoes').addEventListener('click', () => {
        window.location.href = `/frontend/paginas/dono/solicitacoes-espaco.html?id=${espaco.id}`;
    });

    return card;
}

/* ==========================================================================
   ESCOLHER UM ESPAÇO (reaproveitado pelos botões de Avaliações e Histórico)
   Se o dono só tem 1 espaço, pula direto pra página certa; com mais de 1,
   pergunta qual deles antes - "gerarUrl" é quem decide pra qual página cada
   botão de escolha leva.
   ========================================================================== */
function abrirEscolhaEspaco(titulo, gerarUrl) {
    if (espacosCache.length === 0) {
        alert('Você ainda não tem espaços cadastrados.');
        return;
    }

    if (espacosCache.length === 1) {
        window.location.href = gerarUrl(espacosCache[0]);
        return;
    }

    document.getElementById('titulo-escolher-espaco').textContent = titulo;

    const lista = document.getElementById('lista-escolher-espaco');
    lista.innerHTML = '';
    espacosCache.forEach(espaco => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn-ajuste btn-bloco btn-escolher-espaco-avaliacao';
        botao.textContent = espaco.nome;
        botao.addEventListener('click', () => {
            window.location.href = gerarUrl(espaco);
        });
        lista.appendChild(botao);
    });

    document.getElementById('modal-escolher-espaco').classList.add('ativo');
}

function abrirEscolhaAvaliacoes() {
    abrirEscolhaEspaco(
        'Ver avaliações de qual espaço?',
        espaco => `/frontend/paginas/dono/avaliacoes-espaco.html?slug=${espaco.slug}`
    );
}

function abrirEscolhaHistorico() {
    abrirEscolhaEspaco(
        'Ver histórico de qual espaço?',
        espaco => `/frontend/paginas/dono/historico-espaco.html?id=${espaco.id}`
    );
}

function fecharEscolhaEspaco() {
    document.getElementById('modal-escolher-espaco').classList.remove('ativo');
}

// Fecha os modais desta página ao clicar fora da caixa (mesmo padrão dos
// outros modais do site)
window.addEventListener('click', function (event) {
    const modalProximasReservas = document.getElementById('modal-proximas-reservas');
    const modalEscolherEspaco = document.getElementById('modal-escolher-espaco');

    if (event.target === modalProximasReservas) fecharProximasReservas();
    if (event.target === modalEscolherEspaco) fecharEscolhaEspaco();
});
