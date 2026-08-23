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
        registrarVisualizacao(espaco.slug);
    });
});

// Loga a visita pra estatística "Visualizados" da home do cliente (ver GET
// /api/estatisticas) - só registra se tiver alguém logado (é uma métrica
// pessoal) e não trava nada se falhar, já que não é essencial pra página
// de detalhes funcionar.
function registrarVisualizacao(slug) {
    if (!obterUsuarioLogado()) return;

    chamarAPI(`/api/espacos/${slug}/visualizacao`, { method: 'POST' })
        .catch(erro => console.error('Erro ao registrar visualização:', erro));
}

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

    preencherGaleria(espaco);
    preencherBeneficiosEEventos(espaco);
    preencherPontosReferencia(espaco);
    preencherAvaliacoes(espaco);
}

/* ==========================================================================
   GALERIA DE FOTOS
   GET /api/espacos/:slug já devolve "fotos" (as fotos extras cadastradas
   pelo proprietário, além da imagem principal). Só aparece se tiver mais
   de uma foto no total - clicar numa miniatura troca a foto grande do topo.
   ========================================================================== */
function preencherGaleria(espaco) {
    const secao = document.getElementById('galeria-fotos');
    const grid = document.getElementById('galeria-fotos-grid');
    grid.innerHTML = '';

    const todasAsFotos = [espaco.imagem, ...(espaco.fotos || [])].filter(Boolean);

    if (todasAsFotos.length <= 1) {
        secao.style.display = 'none';
        return;
    }

    secao.style.display = 'block';

    todasAsFotos.forEach((url, indice) => {
        const miniatura = document.createElement('img');
        miniatura.src = url;
        miniatura.alt = `Foto ${indice + 1} de ${espaco.nome}`;
        if (indice === 0) miniatura.classList.add('miniatura-ativa');
        miniatura.addEventListener('click', () => trocarFotoPrincipal(url, miniatura));
        grid.appendChild(miniatura);
    });
}

// Troca a foto grande no topo da página e marca qual miniatura está ativa
function trocarFotoPrincipal(url, miniaturaClicada) {
    document.getElementById('espaco-imagem').src = url;
    document.querySelectorAll('.galeria-fotos-grid img').forEach(img => img.classList.remove('miniatura-ativa'));
    miniaturaClicada.classList.add('miniatura-ativa');
}

/* ==========================================================================
   BENEFÍCIOS E EVENTOS PERMITIDOS
   Duas listas simples (GET /api/espacos/:slug já devolve "beneficios" e
   "eventos_permitidos") mostradas lado a lado - cada uma só aparece se o
   proprietário tiver cadastrado pelo menos um item nela, e o bloco das duas
   (.grid-box) some por completo se NENHUMA das duas tiver conteúdo.
   ========================================================================== */

// Preenche uma <ul> com um item de lista por texto, ou esconde a seção
// inteira se a lista vier vazia. Reaproveitada pra Benefícios e Eventos
// Permitidos, que têm exatamente a mesma estrutura (só o conteúdo muda).
function preencherListaEmBox(idSecao, idLista, itens) {
    const secao = document.getElementById(idSecao);
    const lista = document.getElementById(idLista);
    lista.innerHTML = '';

    if (!itens || itens.length === 0) {
        secao.style.display = 'none';
        return false;
    }

    secao.style.display = 'block';

    itens.forEach(texto => {
        const li = document.createElement('li');
        li.textContent = texto; // textContent, não innerHTML - mesma prevenção contra XSS de sempre
        lista.appendChild(li);
    });

    return true;
}

function preencherBeneficiosEEventos(espaco) {
    const temBeneficios = preencherListaEmBox('secao-beneficios', 'lista-beneficios', espaco.beneficios);
    const temEventos = preencherListaEmBox('secao-eventos', 'lista-eventos', espaco.eventos_permitidos);

    // Se nenhuma das duas colunas tem conteúdo, esconde o grid inteiro (senão
    // sobra um espaço vazio na página à toa)
    document.getElementById('grid-beneficios-eventos').style.display =
        (temBeneficios || temEventos) ? 'grid' : 'none';
}

/* ==========================================================================
   PONTOS DE REFERÊNCIA DA LOCALIZAÇÃO
   Lista simples (GET /api/espacos/:slug já devolve "pontos_referencia") -
   só aparece se o proprietário tiver cadastrado pelo menos um.
   ========================================================================== */
function preencherPontosReferencia(espaco) {
    const grid = document.getElementById('pontos-referencia-grid');
    grid.innerHTML = '';

    if (!espaco.pontos_referencia || espaco.pontos_referencia.length === 0) {
        grid.style.display = 'none';
        return;
    }

    grid.style.display = 'flex';

    espaco.pontos_referencia.forEach(texto => {
        const item = document.createElement('div');
        item.className = 'ponto-referencia-item';
        item.innerHTML = '<i class="bi bi-geo"></i>';
        const span = document.createElement('span');
        span.textContent = texto; // textContent, não innerHTML - mesma prevenção contra XSS de sempre
        item.appendChild(span);
        grid.appendChild(item);
    });
}

/* ==========================================================================
   AVALIAÇÕES
   GET /api/espacos/:slug já devolve media_avaliacoes, total_avaliacoes e a
   lista "avaliacoes" (nota, comentário, nome de quem avaliou). Só existem
   avaliações de clientes que tiveram uma reserva Aprovada nesse espaço e
   avaliaram de verdade (ver botão "Avaliar" em paginas/cliente/reservas.js).
   ========================================================================== */

// Number -> "★★★★☆" (arredonda pra estrela cheia mais próxima)
function estrelasParaTexto(nota) {
    const cheias = Math.round(nota);
    return '★'.repeat(cheias) + '☆'.repeat(5 - cheias);
}

// "2026-08-17 01:24:04" (formato do banco) -> "17/08/2026"
function formatarDataAvaliacao(timestamp) {
    const [ano, mes, dia] = timestamp.split(' ')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

function preencherAvaliacoes(espaco) {
    const resumo = document.getElementById('resumo-avaliacoes');
    const lista = document.getElementById('lista-avaliacoes');
    lista.innerHTML = '';

    if (!espaco.total_avaliacoes) {
        resumo.innerHTML = '<p>Este espaço ainda não tem avaliações.</p>';
        return;
    }

    const media = Number(espaco.media_avaliacoes);
    const textoTotal = espaco.total_avaliacoes === 1
        ? '1 avaliação'
        : `${espaco.total_avaliacoes} avaliações`;

    resumo.innerHTML = `
        <span class="estrelas">${estrelasParaTexto(media)}</span>
        <span>${media.toFixed(1)} de 5 · ${textoTotal}</span>
    `;

    espaco.avaliacoes.forEach(avaliacao => {
        const card = document.createElement('div');
        card.className = 'card-avaliacao';
        card.innerHTML = `
            <div class="card-avaliacao-topo">
                <span class="autor"></span>
                <span class="estrelas">${estrelasParaTexto(avaliacao.nota)}</span>
            </div>
            <p class="data"></p>
            <p class="comentario"></p>
        `;
        card.querySelector('.autor').textContent = avaliacao.cliente_nome;
        card.querySelector('.data').textContent = formatarDataAvaliacao(avaliacao.criado_em);
        card.querySelector('.comentario').textContent = avaliacao.comentario || '';
        lista.appendChild(card);
    });
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
