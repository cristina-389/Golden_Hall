/* ==========================================================================
   GOLDEN HALL - PÁGINA DE DETALHES (busca os dados reais na API)
   A página de detalhes é UMA SÓ (detalhes.html) usada pra qualquer espaço -
   ela descobre qual espaço mostrar lendo "?slug=..." da própria URL, então
   busca os dados de verdade em GET /api/espacos/:slug e preenche a tela.
   ========================================================================== */

// Assim que a página termina de carregar, dispara DUAS buscas ao mesmo tempo
// (os dados do espaço E a lista de favoritos de quem estiver logado) e só
// continua quando as DUAS terminarem - Promise.all espera todas as Promises
// de uma vez, em vez de uma de cada vez. Isso evita um "race condition": se
// esperássemos só carregarEspaco(), inicializarBotaoFavoritoDetalhe() podia
// rodar antes da lista de favoritos chegar, e o coração nasceria sempre vazio.
document.addEventListener("DOMContentLoaded", function() {
    Promise.all([carregarEspaco(), atualizarCacheFavoritos()]).then(([espaco]) => {
        if (!espaco) return; // espaço não encontrado - carregarEspaco() já mostrou a mensagem de erro
        inicializarBotaoFavoritoDetalhe(espaco);
    });
});

/* ==========================================================================
   BUSCA OS DADOS DO ESPAÇO NA API E PREENCHE A PÁGINA
   ========================================================================== */
async function carregarEspaco() {
    const parametros = new URLSearchParams(window.location.search);
    const slug = parametros.get('slug');

    const divErro = document.getElementById('espaco-nao-encontrado');
    const divConteudo = document.getElementById('conteudo-espaco');

    if (!slug) {
        document.getElementById('espaco-nao-encontrado-motivo').textContent = 'Nenhum espaço foi especificado no link.';
        divErro.style.display = 'block';
        return null;
    }

    try {
        // chamarAPI vem do global.js - busca em GET /api/espacos/:slug (rota pública)
        const espaco = await chamarAPI('/api/espacos/' + slug);

        // A partir daqui, "espaco" é um objeto vindo do banco de dados:
        // { id, dono_id, slug, nome, descricao, local, capacidade, preco, imagem, criado_em }
        document.body.dataset.espaco = espaco.slug;
        preencherPagina(espaco);

        divConteudo.style.display = 'block';
        return espaco;
    } catch (erro) {
        document.getElementById('espaco-nao-encontrado-motivo').textContent = erro.message;
        divErro.style.display = 'block';
        return null;
    }
}

// Escreve os dados do espaço nos elementos da página (todos com id
// "espaco-..." no HTML, pra ficar fácil de achar qual é qual)
function preencherPagina(espaco) {
    document.title = espaco.nome + ' | Golden Hall';

    document.getElementById('espaco-nome').textContent = espaco.nome;
    document.getElementById('espaco-descricao').textContent = espaco.descricao || '';
    document.getElementById('espaco-sobre').textContent = espaco.descricao || 'Sem descrição cadastrada.';

    const imagem = document.getElementById('espaco-imagem');
    imagem.src = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop';
    imagem.alt = espaco.nome;

    document.getElementById('espaco-capacidade').textContent = formatarCapacidade(espaco.capacidade);
    // Aqui (diferente do card da busca) não tem um <small> separado pro "A
    // partir de", então o texto inteiro fica junto num único elemento
    document.getElementById('espaco-preco').textContent =
        espaco.preco ? `A partir de ${formatarPreco(espaco.preco)}` : formatarPreco(espaco.preco);

    document.getElementById('espaco-local').textContent = espaco.local || 'Local a definir';

    // Monta os links do Google Maps com base no texto de "local" do espaço
    if (espaco.local) {
        const consulta = encodeURIComponent(espaco.local);
        document.getElementById('espaco-link-mapa').href = `https://www.google.com/maps/search/?api=1&query=${consulta}`;
        document.getElementById('espaco-iframe-mapa').src = `https://www.google.com/maps?q=${consulta}&output=embed`;
    }
}

/* ==========================================================================
   BOTÃO DE FAVORITAR NA PÁGINA DE DETALHES
   Recebe o espaço que carregarEspaco() já buscou da API (não precisa ler
   o HTML de novo, já temos os dados "crus" aqui).
   ========================================================================== */
function inicializarBotaoFavoritoDetalhe(espaco) {
    const botao = document.getElementById('btn-favoritar-detalhe');
    if (!botao) return;

    const dadosEspaco = {
        slug: espaco.slug,
        nome: espaco.nome,
        imagem: document.getElementById('espaco-imagem').src,
        local: espaco.local || '',
        capacidade: formatarCapacidade(espaco.capacidade),
        preco: formatarPreco(espaco.preco),
        link: '/frontend/paginas/cliente/detalhes/detalhes.html?slug=' + espaco.slug
    };

    if (isFavorito(espaco.slug)) {
        atualizarIconeFavorito(botao, true);
    }

    botao.addEventListener('click', function () {
        toggleFavorito(dadosEspaco, botao);
    });
}
