/* ==========================================================================
   GOLDEN HALL - CARROSSEL DE AVALIAÇÕES EXCLUSIVO DE DETALHES
   Este script é usado nas 6 páginas de detalhes/*.html. Como não tem
   back-end, as avaliações de cada espaço ficam "hardcoded" aqui mesmo,
   dentro do objeto bancoAvaliacoes, organizadas pelo slug do espaço
   (o mesmo valor que fica em <body data-espaco="..."> de cada página).
   ========================================================================== */

// Lista fixa de avaliações de cada espaço (não vem de nenhum banco de dados,
// é só um objeto com os textos já escritos manualmente)
const bancoAvaliacoes = {
    "chacara-golden": [
        { texto: "A área verde é maravilhosa e tornou nossa confraternização inesquecível.", autor: "— Mariana Oliveira" },
        { texto: "Lugar tranquilo, organizado e perfeito para eventos ao ar livre.", autor: "— João Henrique" },
        { texto: "Paisagem linda e excelente atendimento!", autor: "— Fernanda Rocha" }
    ],
    "salao-golden-luxo": [
        { texto: "O salão superou todas as nossas expectativas.", autor: "— Ana Carolina" },
        { texto: "Ambiente sofisticado e atendimento impecável.", autor: "— Felipe Martins" },
        { texto: "Todos os convidados elogiaram o espaço.", autor: "— Juliana Costa" }
    ],
    "eventos-royal": [
        { texto: "Estrutura moderna e muito elegante.", autor: "— Lucas Ferreira" },
        { texto: "Excelente organização e decoração.", autor: "— Bruna Almeida" },
        { texto: "Perfeito para aniversários e eventos especiais.", autor: "— Renato Silva" }
    ],
    "espaco-premium": [
        { texto: "Infraestrutura impecável e equipe muito profissional.", autor: "— Carla Menezes" },
        { texto: "Tudo ocorreu exatamente como planejado.", autor: "— Vinícius Lopes" },
        { texto: "Um espaço amplo e confortável para grandes eventos.", autor: "— Aline Freitas" }
    ],
    "villa-imperial": [
        { texto: "Arquitetura encantadora e ambiente sofisticado.", autor: "— Daniela Barros" },
        { texto: "Experiência incrível do começo ao fim.", autor: "— Thiago Cardoso" },
        { texto: "Ideal para quem busca exclusividade.", autor: "— Roberta Nunes" }
    ],
    "jardim-das-flores": [
        { texto: "O jardim tornou nossa cerimônia ainda mais especial.", autor: "— Beatriz Campos" },
        { texto: "Ambiente acolhedor e muito bem cuidado.", autor: "— Henrique Moreira" },
        { texto: "Voltaria novamente sem pensar duas vezes.", autor: "— Gabriela Teixeira" }
    ]
};

let indiceAtual = 0; // índice de qual avaliação da lista está sendo exibida no momento

// Escreve na tela o texto e o autor da avaliação atual (indiceAtual),
// pegando a lista certa a partir do slug do espaço (body data-espaco)
function mostrarAvaliacao() {
    const espaco = document.body.dataset.espaco;
    if (!espaco || !bancoAvaliacoes[espaco]) return; // se a página não tiver slug reconhecido, não faz nada

    const lista = bancoAvaliacoes[espaco];

    document.getElementById("texto-avaliacao").textContent = lista[indiceAtual].texto;
    document.getElementById("autor-avaliacao").textContent = lista[indiceAtual].autor;
}

// Botão "❯" do carrossel: avança pra próxima avaliação. O "% lista.length"
// faz o índice voltar pro 0 automaticamente quando passa da última avaliação.
function proximaAvaliacao() {
    const espaco = document.body.dataset.espaco;
    const lista = bancoAvaliacoes[espaco];
    indiceAtual = (indiceAtual + 1) % lista.length;
    mostrarAvaliacao();
}

// Botão "❮" do carrossel: volta pra avaliação anterior. Soma "lista.length"
// antes do "%" pra evitar índice negativo quando está na primeira avaliação (índice 0).
function avaliacaoAnterior() {
    const espaco = document.body.dataset.espaco;
    const lista = bancoAvaliacoes[espaco];
    indiceAtual = (indiceAtual - 1 + lista.length) % lista.length;
    mostrarAvaliacao();
}

// Assim que a página termina de carregar: mostra a primeira avaliação
// (só se essa página tiver o carrossel) e prepara o botão de favoritar
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("texto-avaliacao")) {
        mostrarAvaliacao();
    }

    inicializarBotaoFavoritoDetalhe();
});

/* ==========================================================================
   BOTÃO DE FAVORITAR NA PÁGINA DE DETALHES
   Monta o objeto do espaço lendo o próprio HTML da página (título, foto,
   capacidade, valor e localização), já que cada página de detalhe usa
   sempre a mesma estrutura. Assim não precisa repetir esses dados na mão
   em cada uma das 6 páginas.
   ========================================================================== */
function inicializarBotaoFavoritoDetalhe() {
    const botao = document.getElementById('btn-favoritar-detalhe');
    if (!botao) return;

    const slug = document.body.dataset.espaco;
    if (!slug) return;

    const dadosEspaco = {
        slug: slug,
        nome: document.querySelector('.hero-info h1').textContent.trim(),
        imagem: document.querySelector('.hero-foto img').src,
        local: document.querySelector('.localizacao-info h3').textContent.trim(),
        capacidade: document.querySelectorAll('.mini-card p')[0].textContent.trim(),
        preco: document.querySelectorAll('.mini-card p')[1].textContent.trim(),
        link: 'detalhes/' + slug + '.html'
    };

    if (isFavorito(slug)) {
        atualizarIconeFavorito(botao, true);
    }

    botao.addEventListener('click', function () {
        toggleFavorito(dadosEspaco, botao);
    });
}

/* ==========================================================================
   GALERIA DE FOTOS (MODAL "Ver todas as fotos")
   Mesma ideia do bancoAvaliacoes lá em cima: uma lista fixa de fotos pra
   cada espaço, organizada pelo slug. A primeira foto de cada lista é a
   mesma foto grande que já aparece no topo da página (.hero-foto img).
   ========================================================================== */
const bancoFotos = {
    "chacara-golden": [
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop"
    ],
    "salao-golden-luxo": [
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop"
    ],
    "eventos-royal": [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop"
    ],
    "espaco-premium": [
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop"
    ],
    "villa-imperial": [
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop"
    ],
    "jardim-das-flores": [
        "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop"
    ]
};

let indiceFotoAtual = 0; // índice de qual foto da lista está sendo exibida na galeria

// Chamada assim que o modal-galeria termina de carregar (ver abrirModalGaleria()
// em modais.js). Monta as miniaturas do espaço atual e mostra a primeira foto.
function gerarGaleria() {
    const espaco = document.body.dataset.espaco;
    if (!espaco || !bancoFotos[espaco]) return;

    indiceFotoAtual = 0;

    const miniaturas = document.getElementById('miniaturas-galeria');
    if (miniaturas) {
        miniaturas.innerHTML = '';
        bancoFotos[espaco].forEach((url, indice) => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Miniatura ' + (indice + 1);
            img.onclick = () => selecionarFoto(indice);
            miniaturas.appendChild(img);
        });
    }

    mostrarFotoAtual();
}

// Atualiza a foto grande, o contador ("2 / 4") e marca a miniatura ativa
function mostrarFotoAtual() {
    const espaco = document.body.dataset.espaco;
    const lista = bancoFotos[espaco];
    if (!lista) return;

    const fotoGrande = document.getElementById('foto-galeria-atual');
    const contador = document.getElementById('contador-galeria');
    if (fotoGrande) fotoGrande.src = lista[indiceFotoAtual];
    if (contador) contador.textContent = (indiceFotoAtual + 1) + ' / ' + lista.length;

    const miniaturas = document.querySelectorAll('#miniaturas-galeria img');
    miniaturas.forEach((img, indice) => {
        img.classList.toggle('ativa', indice === indiceFotoAtual);
    });
}

// Botão "❯" da galeria
function proximaFoto() {
    const lista = bancoFotos[document.body.dataset.espaco];
    indiceFotoAtual = (indiceFotoAtual + 1) % lista.length;
    mostrarFotoAtual();
}

// Botão "❮" da galeria
function fotoAnterior() {
    const lista = bancoFotos[document.body.dataset.espaco];
    indiceFotoAtual = (indiceFotoAtual - 1 + lista.length) % lista.length;
    mostrarFotoAtual();
}

// Clicar numa miniatura pula direto pra aquela foto
function selecionarFoto(indice) {
    indiceFotoAtual = indice;
    mostrarFotoAtual();
}