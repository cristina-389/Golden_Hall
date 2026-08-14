/* ==========================================================================
   GOLDEN HALL - PÁGINA DE BUSCA (ligada na API de verdade)
   Os espaços não são mais fixos no HTML: são buscados em GET /api/espacos
   assim que a página carrega e guardados aqui em "todosEspacos". Cada busca/
   filtro só REFILTRA esse array em memória (não faz um pedido novo pra API
   toda vez que a pessoa digita ou aperta "Buscar") e desenha os cards de novo.
   ========================================================================== */

let todosEspacos = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // chamarAPI vem do global.js - GET /api/espacos é uma rota pública
        todosEspacos = await chamarAPI('/api/espacos');
    } catch (erro) {
        console.error('Erro ao carregar espaços:', erro);
    }
});

// Abre/fecha a gaveta de "Filtros avançados" (cidade, evento, capacidade, etc.)
// e gira o ícone de seta (chevron) pra indicar se está aberta ou fechada
function toggleFiltros() {
    const painel = document.getElementById('painelFiltros');
    const chevron = document.getElementById('chevron-icon');

    painel.classList.toggle('ativo');
    chevron.style.transform = painel.classList.contains('ativo') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Limpa o que a pessoa escreveu nos campos de filtro avançado (não limpa a busca principal)
function limparFiltros() {
    document.getElementById('filtro-cidade').value = "";
    document.getElementById('filtro-evento').value = "";
    document.getElementById('filtro-capacidade').value = "";
    document.getElementById('filtro-preco').value = "";

    // Esconde os resultados novamente ao limpar (volta pro estado inicial da busca)
    document.querySelector('.barra-resultados-info').style.display = "none";
    document.querySelector('.resultados-busca').style.display = "none";
}

// Filtra "todosEspacos" com base no que foi digitado e desenha os cards que sobrarem
function filtrarEspacos() {
    const buscaPrincipal = document.getElementById('input-busca').value.toLowerCase();
    const txtCidade = document.getElementById('filtro-cidade').value.toLowerCase();
    const txtEvento = document.getElementById('filtro-evento').value.toLowerCase();
    const numCapacidade = parseInt(document.getElementById('filtro-capacidade').value) || 0;
    const numPrecoMax = parseFloat(document.getElementById('filtro-preco').value) || Infinity;

    const resultado = todosEspacos.filter(espaco => {
        const tags = `${espaco.nome} ${espaco.descricao || ''} ${espaco.local || ''}`.toLowerCase();
        const cidade = (espaco.local || '').toLowerCase();
        const capacidade = espaco.capacidade || 0;
        const preco = espaco.preco || 0;

        const bateBusca = buscaPrincipal === "" || tags.includes(buscaPrincipal);
        const bateCidade = txtCidade === "" || cidade.includes(txtCidade);
        const bateEvento = txtEvento === "" || tags.includes(txtEvento);
        const bateCapacidade = numCapacidade === 0 || capacidade >= numCapacidade;
        const batePreco = preco <= numPrecoMax;

        return bateBusca && bateCidade && bateEvento && bateCapacidade && batePreco;
    });

    renderizarCards(resultado);

    // Exibe o contador e o bloco de cards resultados
    document.querySelector('.barra-resultados-info').style.display = "flex";
    document.querySelector('.resultados-busca').style.display = "block";
    document.getElementById('contador-cards').textContent = resultado.length;

    // O alerta de "Não encontrou?" sempre aparece junto com a busca (mesmo
    // quando encontrou resultados - serve como um lembrete/CTA no fim da lista)
    document.getElementById('alerta-vazio').style.display = "block";
}

// Desenha os cards dos espaços passados dentro de ".resultados-busca .cards",
// substituindo o que tinha antes. Usa textContent (não innerHTML) pra
// escrever o nome/local do espaço - assim, mesmo que um dono cadastre um
// espaço com algum texto "esquisito" no nome, ele nunca vira HTML de
// verdade na página (evita um tipo de falha de segurança chamado XSS).
function renderizarCards(lista) {
    const container = document.querySelector('.resultados-busca .cards');
    container.innerHTML = '';

    lista.forEach(espaco => {
        container.appendChild(criarCardEspaco(espaco));
    });

    // Depois de desenhar os cards, marca com coração cheio os que a pessoa
    // já tinha favoritado antes (mesma ideia do que já roda no global.js,
    // só que esses cards acabaram de ser criados agora)
    container.querySelectorAll('.btn-favoritar[data-slug]').forEach(botao => {
        const slug = botao.getAttribute('data-slug');
        if (isFavorito(slug)) atualizarIconeFavorito(botao, true);
    });
}

function criarCardEspaco(espaco) {
    const nome = espaco.nome || 'Espaço sem nome';
    const local = espaco.local || 'Local a definir';
    // formatarCapacidade/formatarPreco vêm do global.js (compartilhadas com
    // detalhes.js e favoritos.js, pra não repetir esse texto em três lugares)
    const capacidadeTexto = formatarCapacidade(espaco.capacidade);
    const precoTexto = formatarPreco(espaco.preco);
    const imagem = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop';
    const link = 'detalhes/detalhes.html?slug=' + espaco.slug;

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.cidade = local.toLowerCase();
    card.dataset.capacidade = espaco.capacidade || 0;
    card.dataset.preco = espaco.preco || 0;

    const btnFavoritar = document.createElement('button');
    btnFavoritar.className = 'btn-favoritar';
    btnFavoritar.dataset.slug = espaco.slug;
    btnFavoritar.title = 'Adicionar aos favoritos';
    btnFavoritar.innerHTML = '<i class="bi bi-heart"></i>';
    btnFavoritar.addEventListener('click', function () {
        toggleFavorito({
            slug: espaco.slug,
            nome,
            imagem,
            local,
            capacidade: capacidadeTexto,
            preco: 'A partir de ' + precoTexto,
            link
        }, this);
    });

    const img = document.createElement('img');
    img.src = imagem;
    img.alt = nome;

    const conteudo = document.createElement('div');
    conteudo.className = 'card-content';
    conteudo.innerHTML = `
        <h3></h3>
        <p class="card-loc"><i class="bi bi-geo-alt"></i> <span class="texto-local"></span></p>
        <p class="card-cap"><i class="bi bi-people"></i> ${capacidadeTexto}</p>
        <span class="price"><small>A partir de</small> ${precoTexto}</span>
        <button class="btn-detalhes">Ver detalhes</button>
    `;
    conteudo.querySelector('h3').textContent = nome;
    conteudo.querySelector('.texto-local').textContent = local;
    conteudo.querySelector('.btn-detalhes').addEventListener('click', () => { location.href = link; });

    card.appendChild(btnFavoritar);
    card.appendChild(img);
    card.appendChild(conteudo);
    return card;
}

// Botão "Nova busca" do alerta de "Não encontrou o que procura?":
// reseta completamente a tela para o estado original (sem buscas)
function limparFiltrosEComecar() {
    document.getElementById('input-busca').value = "";

    // Limpa os campos dos filtros avançados
    document.getElementById('filtro-cidade').value = "";
    document.getElementById('filtro-evento').value = "";
    document.getElementById('filtro-capacidade').value = "";
    document.getElementById('filtro-preco').value = "";

    // Esconde tudo até que uma nova busca seja feita
    document.querySelector('.barra-resultados-info').style.display = "none";
    document.querySelector('.resultados-busca').style.display = "none";
    document.getElementById('alerta-vazio').style.display = "none";

    // Foca no campo de busca novamente, pra pessoa já poder digitar
    document.getElementById('input-busca').focus();
}
