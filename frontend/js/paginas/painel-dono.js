/* ==========================================================================
   GOLDEN HALL - PAINEL DO DONO DE ESPAÇOS
   Página exclusiva para contas do tipo "dono": lista, cria, edita e apaga
   os espaços dele (CRUD completo com a API que já construímos), e mostra
   as reservas recebidas em cada espaço, com botão de aprovar/recusar.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Essa página é exclusiva pra donos - clientes (ou quem não está logado)
    // são mandados de volta pra home logada
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'dono') {
        alert('Esta área é exclusiva para contas de dono de espaço.');
        window.location.href = '../index-logado.html';
        return;
    }

    carregarMeusEspacos();
    document.getElementById('form-espaco').addEventListener('submit', salvarEspaco);
});

// Guarda o id do espaço sendo editado no momento. "null" significa que o
// formulário está sendo usado pra CRIAR um espaço novo, não editar um existente.
let espacoEmEdicaoId = null;

/* ==========================================================================
   LISTA DE ESPAÇOS
   ========================================================================== */
async function carregarMeusEspacos() {
    const container = document.getElementById('lista-espacos-dono');

    let espacos = [];
    try {
        espacos = await chamarAPI('/api/meus-espacos');
    } catch (erro) {
        container.innerHTML = `<p>${erro.message}</p>`;
        return;
    }

    document.getElementById('stat-total-espacos').textContent = espacos.length;

    if (espacos.length === 0) {
        container.innerHTML = `
            <div class="beneficios-favoritos" style="grid-column: 1 / -1;">
                <p style="grid-column: 1 / -1; text-align: center; margin-bottom: 16px;">
                    Você ainda não cadastrou nenhum espaço.
                </p>
                <button class="btn-novo-espaco" style="grid-column: 1 / -1; justify-self: center;" onclick="abrirFormularioEspaco()">
                    <i class="bi bi-plus-lg"></i> Cadastrar meu primeiro espaço
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    espacos.forEach(espaco => container.appendChild(criarCardEspacoDono(espaco)));
}

// Monta o card de um espaço do dono, com os botões de Editar/Reservas/Excluir.
// Reaproveita a classe ".card-favorito" (mesmo visual dos cards da página de
// favoritos), só trocando o coração pelos botões de gerenciamento.
function criarCardEspacoDono(espaco) {
    const imagem = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop';

    const card = document.createElement('div');
    card.className = 'card-favorito';
    card.innerHTML = `
        <div class="imagem-favorito">
            <img src="${imagem}">
        </div>
        <div class="card-favorito-content">
            <h3></h3>
            <p><i class="bi bi-geo-alt"></i> <span class="texto-local"></span></p>
            <p><i class="bi bi-people"></i> ${formatarCapacidade(espaco.capacidade)}</p>
            <div class="card-favorito-preco"><small>A partir de</small> ${formatarPreco(espaco.preco)}</div>
            <div class="acoes-espaco-dono">
                <button class="btn-ajuste btn-editar-espaco"><i class="bi bi-pencil"></i> Editar</button>
                <button class="btn-ajuste btn-ver-reservas-espaco"><i class="bi bi-calendar4-event"></i> Reservas</button>
                <button class="btn-cancelar-reserva btn-excluir-espaco"><i class="bi bi-trash"></i> Excluir</button>
            </div>
        </div>
    `;

    // textContent pro nome/local (não innerHTML) - mesma prevenção contra
    // XSS já usada em buscar.js e favoritos.js
    card.querySelector('img').alt = espaco.nome;
    card.querySelector('h3').textContent = espaco.nome;
    card.querySelector('.texto-local').textContent = espaco.local || 'Local a definir';

    card.querySelector('.btn-editar-espaco').addEventListener('click', () => abrirFormularioEspaco(espaco));
    card.querySelector('.btn-ver-reservas-espaco').addEventListener('click', () => abrirReservasEspaco(espaco));
    card.querySelector('.btn-excluir-espaco').addEventListener('click', () => excluirEspaco(espaco));

    return card;
}

/* ==========================================================================
   CRIAR / EDITAR ESPAÇO (mesmo modal serve pros dois casos)
   ========================================================================== */

// Abre o formulário. Se "espaco" for passado, entra em modo EDIÇÃO (os
// campos já nascem preenchidos com os dados atuais); sem argumento, é um
// cadastro novo (formulário em branco).
function abrirFormularioEspaco(espaco = null) {
    espacoEmEdicaoId = espaco ? espaco.id : null;

    document.getElementById('titulo-form-espaco').textContent = espaco ? 'Editar Espaço' : 'Cadastrar Espaço';
    document.getElementById('espaco-form-nome').value = espaco ? espaco.nome : '';
    document.getElementById('espaco-form-descricao').value = espaco ? (espaco.descricao || '') : '';
    document.getElementById('espaco-form-local').value = espaco ? (espaco.local || '') : '';
    document.getElementById('espaco-form-capacidade').value = espaco ? (espaco.capacidade || '') : '';
    document.getElementById('espaco-form-preco').value = espaco ? (espaco.preco || '') : '';
    document.getElementById('espaco-form-imagem').value = espaco ? (espaco.imagem || '') : '';

    document.getElementById('modal-form-espaco').classList.add('ativo');
}

function fecharFormularioEspaco() {
    document.getElementById('modal-form-espaco').classList.remove('ativo');
}

// Ao enviar o formulário: cria um espaço novo (POST) se espacoEmEdicaoId for
// null, ou atualiza o espaço existente (PUT) caso contrário.
async function salvarEspaco(event) {
    event.preventDefault();

    const capacidade = document.getElementById('espaco-form-capacidade').value;
    const preco = document.getElementById('espaco-form-preco').value;

    const dados = {
        nome: document.getElementById('espaco-form-nome').value,
        descricao: document.getElementById('espaco-form-descricao').value,
        local: document.getElementById('espaco-form-local').value,
        capacidade: capacidade ? Number(capacidade) : null,
        preco: preco ? Number(preco) : null,
        imagem: document.getElementById('espaco-form-imagem').value
    };

    try {
        if (espacoEmEdicaoId) {
            await chamarAPI(`/api/espacos/${espacoEmEdicaoId}`, { method: 'PUT', body: JSON.stringify(dados) });
        } else {
            await chamarAPI('/api/espacos', { method: 'POST', body: JSON.stringify(dados) });
        }

        fecharFormularioEspaco();
        carregarMeusEspacos(); // redesenha a lista já com a mudança
    } catch (erro) {
        alert(erro.message);
    }
}

async function excluirEspaco(espaco) {
    if (!confirm(`Tem certeza que deseja excluir "${espaco.nome}"? Essa ação não pode ser desfeita.`)) {
        return;
    }

    try {
        await chamarAPI(`/api/espacos/${espaco.id}`, { method: 'DELETE' });
        carregarMeusEspacos();
    } catch (erro) {
        alert(erro.message);
    }
}

/* ==========================================================================
   RESERVAS RECEBIDAS EM CADA ESPAÇO (aprovar/recusar)
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
}

// Monta um card com os dados de uma reserva recebida. Se ela ainda estiver
// "Pendente", mostra os botões de Aprovar/Recusar; reservas já Aprovadas ou
// Canceladas só ficam visíveis, sem ação (decisão já foi tomada).
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
                <p><i class="bi bi-clock"></i> Horário: <strong>${reserva.horario || '-'}</strong></p>
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
        btnAprovar.addEventListener('click', () => alterarStatusReserva(reserva.id, 'Aprovado'));

        const btnRecusar = document.createElement('button');
        btnRecusar.className = 'btn-cancelar-alerta';
        btnRecusar.textContent = 'Recusar';
        btnRecusar.addEventListener('click', () => alterarStatusReserva(reserva.id, 'Cancelado'));

        botoes.appendChild(btnRecusar);
        botoes.appendChild(btnAprovar);
        div.querySelector('.conteudo-linha-reserva').appendChild(botoes);
    }

    return div;
}

async function alterarStatusReserva(idReserva, novoStatus) {
    try {
        await chamarAPI(`/api/reservas/${idReserva}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: novoStatus })
        });
        fecharReservasEspaco();
    } catch (erro) {
        alert(erro.message);
    }
}
