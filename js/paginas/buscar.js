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

/* ==========================================================================
   INTERPRETAÇÃO DA BUSCA PRINCIPAL EM TEXTO LIVRE
   Nem sempre a pessoa sabe o nome do espaço - às vezes ela só descreve o
   que precisa, tipo "espaço em Americana pra casamento de 4000 pras 400
   pessoas". Em vez de tratar a frase inteira como um texto único (que
   dificilmente bate com o nome/descrição de algum espaço), a busca tenta
   primeiro achar pelo NOME (se a pessoa já sabe qual é) e, se não achar,
   separa a frase em cidade, capacidade, preço máximo e o que sobrar (tipo
   de evento ou pedaços do nome) - cada pedaço identificado é comparado com
   o dado real do espaço.
   ========================================================================== */

// Tira acentos e deixa tudo minúsculo, pra "Americana"/"américa" ou "São
// Paulo"/"sao paulo" combinarem na busca não importa como foi digitado
function normalizarTexto(texto) {
    return (texto || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

// Palavras que não ajudam a identificar nada específico - ignoradas ao
// procurar o que sobrou da frase depois de tirar cidade/capacidade/preço
const PALAVRAS_IGNORADAS_BUSCA = new Set([
    'espaco', 'espacos', 'pra', 'pras', 'para', 'pro', 'pros', 'com', 'de',
    'do', 'da', 'dos', 'das', 'em', 'num', 'numa', 'um', 'uma', 'e', 'ou',
    'no', 'na', 'ate', 'reais', 'r$'
]);

// Separa a frase digitada em: capacidade mínima ("400 pessoas"), preço
// máximo ("de 4000", "R$ 4000", "4000 reais") e cidade ("em Americana") -
// o que sobrar depois de tirar esses 3 pedaços é o "termo livre" (geralmente
// o tipo de evento, tipo "casamento")
function interpretarBuscaLivre(textoOriginal) {
    let restante = ' ' + normalizarTexto(textoOriginal) + ' ';

    let capacidade = null;
    const matchCapacidade = restante.match(/(\d+)\s*pessoas?/);
    if (matchCapacidade) {
        capacidade = parseInt(matchCapacidade[1], 10);
        restante = restante.replace(matchCapacidade[0], ' ');
    }

    let preco = null;
    const matchPrecoComSinal = restante.match(/r\$\s*(\d+)|(\d+)\s*reais/);
    if (matchPrecoComSinal) {
        preco = parseInt(matchPrecoComSinal[1] || matchPrecoComSinal[2], 10);
        restante = restante.replace(matchPrecoComSinal[0], ' ');
    } else {
        // Nenhum "R$"/"reais" junto do número - mesmo assim, um número solto
        // que sobrou (depois de já tirar a capacidade) normalmente é o
        // orçamento que a pessoa tem em mente
        const matchNumeroSolto = restante.match(/\d+/);
        if (matchNumeroSolto) {
            preco = parseInt(matchNumeroSolto[0], 10);
            restante = restante.replace(matchNumeroSolto[0], ' ');
        }
    }

    let cidade = null;
    const matchCidade = restante.match(/\bem\s+([a-z\s]+?)(?:\s+\b(?:pra|para|pro|com|de|do|da)\b|$)/);
    if (matchCidade) {
        cidade = matchCidade[1].trim();
        restante = restante.replace(matchCidade[0], ' ');
    }

    const termosLivres = restante
        .split(/\s+/)
        .map(termo => termo.trim())
        .filter(termo => termo && !PALAVRAS_IGNORADAS_BUSCA.has(termo));

    return { capacidade, preco, cidade, termosLivres };
}

// Decide se UM espaço bate com o que a pessoa digitou na busca principal.
// Primeiro tenta o jeito mais simples: será que é o NOME do espaço? Se for,
// resolve na hora. Senão, interpreta a frase e exige que cada pedaço
// identificado (cidade/capacidade/preço/termo livre) bata com os dados
// reais do espaço - "eventos_permitidos" entra na comparação do termo
// livre, pra "casamento" bater com o que o proprietário realmente cadastrou.
function espacoBateNaBuscaPrincipal(espaco, textoOriginal) {
    const textoNormalizado = normalizarTexto(textoOriginal);
    if (!textoNormalizado) return true;

    if (normalizarTexto(espaco.nome).includes(textoNormalizado)) return true;

    const { capacidade, preco, cidade, termosLivres } = interpretarBuscaLivre(textoOriginal);

    if (capacidade && (espaco.capacidade || 0) < capacidade) return false;
    if (preco && (espaco.preco || 0) > preco) return false;
    if (cidade && !normalizarTexto(espaco.local).includes(cidade)) return false;

    if (termosLivres.length > 0) {
        const textoDoEspaco = normalizarTexto(
            `${espaco.nome} ${espaco.descricao || ''} ${espaco.local || ''} ${(espaco.eventos_permitidos || []).join(' ')}`
        );
        return termosLivres.every(termo => textoDoEspaco.includes(termo));
    }

    return true;
}

// Filtra "todosEspacos" com base no que foi digitado e desenha os cards que sobrarem
function filtrarEspacos() {
    const buscaPrincipal = document.getElementById('input-busca').value.trim();
    const txtCidade = document.getElementById('filtro-cidade').value.trim();
    const txtEvento = document.getElementById('filtro-evento').value.trim();
    const txtCapacidade = document.getElementById('filtro-capacidade').value.trim();
    const txtPreco = document.getElementById('filtro-preco').value.trim();

    // Sem nada preenchido (nem a busca principal, nem nenhum filtro), não
    // tem o que buscar de verdade - em vez de mostrar TODOS os espaços sem
    // a pessoa ter pedido nada, avisa e não faz a busca
    if (!buscaPrincipal && !txtCidade && !txtEvento && !txtCapacidade && !txtPreco) {
        alert('Digite algo na busca ou escolha pelo menos um filtro antes de buscar.');
        return;
    }

    const numCapacidade = parseInt(txtCapacidade) || 0;
    const numPrecoMax = parseFloat(txtPreco) || Infinity;
    const txtCidadeNormalizado = normalizarTexto(txtCidade);
    const txtEventoNormalizado = normalizarTexto(txtEvento);

    const resultado = todosEspacos.filter(espaco => {
        const capacidade = espaco.capacidade || 0;
        const preco = espaco.preco || 0;
        const eventosDoEspaco = normalizarTexto((espaco.eventos_permitidos || []).join(' '));

        const bateBusca = espacoBateNaBuscaPrincipal(espaco, buscaPrincipal);
        const bateCidade = txtCidadeNormalizado === "" || normalizarTexto(espaco.local).includes(txtCidadeNormalizado);
        const bateEvento = txtEventoNormalizado === "" || eventosDoEspaco.includes(txtEventoNormalizado);
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

    // Rola suavemente até o resultado - sem isso, em telas menores a pessoa
    // clicava em "Buscar espaços" e não via nada acontecer (o resultado
    // aparecia mais embaixo, fora da área visível, sem indicar isso)
    document.querySelector('.barra-resultados-info').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const link = '/frontend/paginas/cliente/detalhes/detalhes.html?slug=' + espaco.slug;

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
