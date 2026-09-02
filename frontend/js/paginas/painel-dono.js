/* ==========================================================================
   GOLDEN HALL - PAINEL DO DONO DE ESPAÇOS
   Página exclusiva para contas do tipo "proprietario": lista, cria, edita e
   apaga os espaços dele (CRUD completo com a API que já construímos), e
   mostra as reservas recebidas em cada espaço, com botão de aprovar/recusar.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Essa página é exclusiva pra proprietários - clientes (ou quem não está
    // logado) são mandados de volta pra home logada
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    carregarMeusEspacos();
    carregarResumoEstatisticas();
    document.getElementById('form-espaco').addEventListener('submit', salvarEspaco);
});

// Guarda o id do espaço sendo editado no momento. "null" significa que o
// formulário está sendo usado pra CRIAR um espaço novo, não editar um existente.
let espacoEmEdicaoId = null;

/* ==========================================================================
   RESUMO DO PAINEL (mesma rota usada na home do proprietário, GET
   /api/estatisticas-dono) - espaços cadastrados, reservas pendentes e
   avaliação média, tudo calculado de verdade no servidor.
   ========================================================================== */
async function carregarResumoEstatisticas() {
    try {
        const estatisticas = await chamarAPI('/api/estatisticas-dono');
        document.getElementById('stat-total-espacos').textContent = estatisticas.total_espacos;
        document.getElementById('stat-pendentes').textContent = estatisticas.reservas_pendentes;
        document.getElementById('stat-avaliacao').textContent =
            estatisticas.total_avaliacoes > 0 ? Number(estatisticas.avaliacao_media).toFixed(1) : '—';

        // Destaca "Reservas pendentes" com uma cor de alerta quando tem
        // alguma esperando resposta - é o número mais acionável dos 3
        document.getElementById('resumo-pendentes').classList.toggle('tem-pendencia', estatisticas.reservas_pendentes > 0);
    } catch (erro) {
        console.error('Erro ao carregar o resumo do painel:', erro);
    }
}

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
            <div class="estado-vazio-painel">
                <i class="bi bi-shop"></i>
                <p>Você ainda não cadastrou nenhum espaço.</p>
                <button class="btn btn-gold btn-cadastrar-espaco" onclick="abrirFormularioEspaco()">
                    <i class="bi bi-plus-lg"></i> Cadastrar meu primeiro espaço
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    espacos.forEach(espaco => container.appendChild(criarCardEspacoDono(espaco)));
}

// Monta o card de um espaço do dono: foto com nome/local sobrepostos, preço
// em destaque e os botões de Editar/Reservas/Excluir.
function criarCardEspacoDono(espaco) {
    const imagem = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop';

    const card = document.createElement('div');
    card.className = 'card-espaco-dono';
    card.innerHTML = `
        <div class="imagem-espaco-dono">
            <img src="${imagem}">
            <div class="overlay-imagem-espaco-dono">
                <h3></h3>
                <p><i class="bi bi-geo-alt"></i> <span class="texto-local"></span></p>
            </div>
        </div>
        <div class="conteudo-card-espaco-dono">
            <div class="linha-info-espaco-dono">
                <span><i class="bi bi-people"></i>${formatarCapacidade(espaco.capacidade)}</span>
                <span class="preco-espaco-dono">${formatarPreco(espaco.preco)}</span>
            </div>
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
//
// GET /api/meus-espacos (usado na listagem) não traz benefícios/fotos, só os
// dados básicos - por isso, ao editar, buscamos os detalhes completos em
// GET /api/espacos/:slug (mesma rota que a página de detalhes usa) antes de
// preencher o formulário, senão esses dois campos apareceriam sempre vazios.
async function abrirFormularioEspaco(espaco = null) {
    espacoEmEdicaoId = espaco ? espaco.id : null;

    document.getElementById('titulo-form-espaco').textContent = espaco ? 'Editar Espaço' : 'Cadastrar Espaço';
    document.getElementById('espaco-form-nome').value = espaco ? espaco.nome : '';
    document.getElementById('espaco-form-descricao').value = espaco ? (espaco.descricao || '') : '';
    document.getElementById('espaco-form-sobre').value = espaco ? (espaco.sobre || '') : '';
    document.getElementById('espaco-form-local').value = espaco ? (espaco.local || '') : '';
    document.getElementById('espaco-form-capacidade').value = espaco ? (espaco.capacidade || '') : '';
    document.getElementById('espaco-form-preco').value = espaco ? (espaco.preco || '') : '';
    document.getElementById('espaco-form-imagem').value = espaco ? (espaco.imagem || '') : '';
    document.getElementById('espaco-form-fotos').value = '';
    document.getElementById('espaco-form-beneficios').value = '';
    document.getElementById('espaco-form-eventos').value = '';
    document.getElementById('espaco-form-pontos-referencia').value = '';
    atualizarPreviewImagemPrincipal();

    document.getElementById('modal-form-espaco').classList.add('ativo');

    if (espaco) {
        try {
            const detalhes = await chamarAPI(`/api/espacos/${espaco.slug}`);
            // "fotos", "beneficios", etc. chegam da API como array - aqui
            // viram texto (um por linha) pra caber num <textarea>; o
            // processo inverso acontece em salvarEspaco(), que quebra o
            // texto de volta em array antes de enviar
            document.getElementById('espaco-form-fotos').value = (detalhes.fotos || []).join('\n');
            document.getElementById('espaco-form-beneficios').value = (detalhes.beneficios || []).join('\n');
            document.getElementById('espaco-form-eventos').value = (detalhes.eventos_permitidos || []).join('\n');
            document.getElementById('espaco-form-pontos-referencia').value = (detalhes.pontos_referencia || []).join('\n');
        } catch (erro) {
            console.error('Erro ao buscar os detalhes completos do espaço:', erro);
        }
    }
}

function fecharFormularioEspaco() {
    document.getElementById('modal-form-espaco').classList.remove('ativo');
}

/* ==========================================================================
   FOTOS DO ESPAÇO (link colado OU escolhida da galeria do aparelho)
   Os dois jeitos preenchem o mesmo campo de texto por trás (o campo
   "espaco-form-imagem" e as linhas do "espaco-form-fotos") - pro back-end
   não faz diferença se é uma URL ou uma foto em base64, os dois são só
   texto guardado em "imagem"/"fotos". A foto escolhida da galeria passa por
   redimensionarImagem() (compartilhada em js/global.js, mesma função usada
   pela foto de perfil) antes de virar base64, pra não mandar uma foto de
   celular de vários MB pro servidor.
   ========================================================================== */
const TAMANHO_MAXIMO_FOTO_ESPACO = 1000; // largura/altura máxima, em pixels

// Mostra uma pré-visualização da foto principal sempre que o campo mudar -
// tanto por digitação/colagem de link quanto por escolha da galeria
function atualizarPreviewImagemPrincipal() {
    const valor = document.getElementById('espaco-form-imagem').value.trim();
    const icone = document.getElementById('preview-imagem-principal-icone');
    const img = document.getElementById('preview-imagem-principal-foto');

    if (valor) {
        img.src = valor;
        img.style.display = 'block';
        icone.style.display = 'none';
    } else {
        img.style.display = 'none';
        icone.style.display = 'block';
    }
}

async function escolherFotoPrincipalDaGaleria(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
        alert('Escolha um arquivo de imagem.');
        event.target.value = '';
        return;
    }

    const fotoBase64 = await redimensionarImagem(arquivo, TAMANHO_MAXIMO_FOTO_ESPACO);
    document.getElementById('espaco-form-imagem').value = fotoBase64;
    atualizarPreviewImagemPrincipal();
    event.target.value = ''; // permite escolher o mesmo arquivo de novo depois
}

// Aceita escolher várias fotos de uma vez (input com "multiple") - cada uma
// vira uma linha nova no textarea, sem apagar os links que já estavam lá
async function escolherFotosExtrasDaGaleria(event) {
    const arquivos = Array.from(event.target.files).filter(arquivo => arquivo.type.startsWith('image/'));
    if (arquivos.length === 0) return;

    const textarea = document.getElementById('espaco-form-fotos');
    const linhas = textarea.value.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);

    for (const arquivo of arquivos) {
        linhas.push(await redimensionarImagem(arquivo, TAMANHO_MAXIMO_FOTO_ESPACO));
    }

    textarea.value = linhas.join('\n');
    event.target.value = '';
}

// Ao enviar o formulário: cria um espaço novo (POST) se espacoEmEdicaoId for
// null, ou atualiza o espaço existente (PUT) caso contrário.
async function salvarEspaco(event) {
    event.preventDefault();

    const capacidade = document.getElementById('espaco-form-capacidade').value;
    const preco = document.getElementById('espaco-form-preco').value;

    // Cada linha do <textarea> vira um item do array (linhas em branco são
    // ignoradas) - é assim que "Estacionamento\nAr condicionado" vira
    // ["Estacionamento", "Ar condicionado"] antes de mandar pra API
    const quebrarEmLinhas = (texto) => texto.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);

    const dados = {
        nome: document.getElementById('espaco-form-nome').value,
        descricao: document.getElementById('espaco-form-descricao').value,
        sobre: document.getElementById('espaco-form-sobre').value,
        local: document.getElementById('espaco-form-local').value,
        capacidade: capacidade ? Number(capacidade) : null,
        preco: preco ? Number(preco) : null,
        imagem: document.getElementById('espaco-form-imagem').value,
        fotos: quebrarEmLinhas(document.getElementById('espaco-form-fotos').value),
        beneficios: quebrarEmLinhas(document.getElementById('espaco-form-beneficios').value),
        eventos_permitidos: quebrarEmLinhas(document.getElementById('espaco-form-eventos').value),
        pontos_referencia: quebrarEmLinhas(document.getElementById('espaco-form-pontos-referencia').value)
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
        btnAprovar.addEventListener('click', () => alterarStatusReserva(reserva.id, 'Aprovado'));

        const btnRecusar = document.createElement('button');
        btnRecusar.className = 'btn-cancelar-alerta';
        btnRecusar.textContent = 'Recusar';
        btnRecusar.addEventListener('click', () => alterarStatusReserva(reserva.id, 'Cancelado'));

        botoes.appendChild(btnRecusar);
        botoes.appendChild(btnAprovar);
        div.querySelector('.conteudo-linha-reserva').appendChild(botoes);
    } else if (reserva.status === 'Aprovado') {
        // Reserva já aprovada também pode ser cancelada depois (ex: o
        // proprietário precisa liberar a data, ou quer excluir o espaço e
        // essa reserva está impedindo - ver validação em DELETE
        // /api/espacos/:id). Pede confirmação extra porque, diferente de
        // recusar uma reserva ainda Pendente, aqui a pessoa já contava com
        // a data confirmada - e a data fica livre pra outra pessoa
        // reservar IMEDIATAMENTE (ver GET /api/espacos/:slug/datas-ocupadas),
        // então cancelar muito perto da data do evento pode fazer o
        // proprietário perder esse dia, sem tempo de conseguir outra reserva.
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
            if (certeza) alterarStatusReserva(reserva.id, 'Cancelado');
        });
        div.querySelector('.conteudo-linha-reserva').appendChild(btnCancelar);
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
        carregarResumoEstatisticas(); // atualiza o número de "Reservas pendentes" do resumo
    } catch (erro) {
        alert(erro.message);
    }
}

// Fecha os modais desta página ao clicar fora da caixa (no overlay escuro
// por trás dela) - mesmo comportamento dos outros modais do site (ver
// window.addEventListener('click', ...) em js/modais.js)
window.addEventListener('click', function (event) {
    const modalFormEspaco = document.getElementById('modal-form-espaco');
    const modalReservasEspaco = document.getElementById('modal-reservas-espaco');

    if (event.target === modalFormEspaco) fecharFormularioEspaco();
    if (event.target === modalReservasEspaco) fecharReservasEspaco();
});
