// Aplica o tema salvo quando a página é carregada
window.onload = function () {

  const body = document.body;
  const heroImg = document.getElementById("heroImg");
  const button = document.querySelector(".theme-toggle");

  // Recupera o tema salvo ou usa "dark" como padrão
  const theme = localStorage.getItem("theme") || "dark";

  if (theme === "light") {
      body.classList.remove("dark");

      if (heroImg) {
          heroImg.src = "./Imagens/goldenhall-light.png";
      }

      if (button) {
          button.innerHTML = "☀️";
      }

  } else {
      body.classList.add("dark");

      if (heroImg) {
          heroImg.src = "./Imagens/goldenhall-dark.png";
      }

      if (button) {
          button.innerHTML = "🌙";
      }
  }
};


// Função para trocar o tema
function toggleTheme() {

  const body = document.body;
  const heroImg = document.getElementById("heroImg");
  const button = document.querySelector(".theme-toggle");

  body.classList.toggle("dark");

  if (body.classList.contains("dark")) {

      localStorage.setItem("theme", "dark");

      if (heroImg) {
          heroImg.src = "./Imagens/goldenhall-dark.png";
      }

      if (button) {
          button.innerHTML = "🌙";
      }

  } else {

      localStorage.setItem("theme", "light");

      if (heroImg) {
          heroImg.src = "./Imagens/goldenhall-light.png";
      }

      if (button) {
          button.innerHTML = "☀️";
      }
  }
}

const bancoAvaliacoes = {

    "chacara-golden": [
        {
            texto: "A área verde é maravilhosa e tornou nossa confraternização inesquecível.",
            autor: "— Mariana Oliveira"
        },
        {
            texto: "Lugar tranquilo, organizado e perfeito para eventos ao ar livre.",
            autor: "— João Henrique"
        },
        {
            texto: "Paisagem linda e excelente atendimento!",
            autor: "— Fernanda Rocha"
        }
    ],

    "salao-golden-luxo": [
        {
            texto: "O salão superou todas as nossas expectativas.",
            autor: "— Ana Carolina"
        },
        {
            texto: "Ambiente sofisticado e atendimento impecável.",
            autor: "— Felipe Martins"
        },
        {
            texto: "Todos os convidados elogiaram o espaço.",
            autor: "— Juliana Costa"
        }
    ],

    "eventos-royal": [
        {
            texto: "Estrutura moderna e muito elegante.",
            autor: "— Lucas Ferreira"
        },
        {
            texto: "Excelente organização e decoração.",
            autor: "— Bruna Almeida"
        },
        {
            texto: "Perfeito para aniversários e eventos especiais.",
            autor: "— Renato Silva"
        }
    ],

    "espaco-premium": [
        {
            texto: "Infraestrutura impecável e equipe muito profissional.",
            autor: "— Carla Menezes"
        },
        {
            texto: "Tudo ocorreu exatamente como planejado.",
            autor: "— Vinícius Lopes"
        },
        {
            texto: "Um espaço amplo e confortável para grandes eventos.",
            autor: "— Aline Freitas"
        }
    ],

    "villa-imperial": [
        {
            texto: "Arquitetura encantadora e ambiente sofisticado.",
            autor: "— Daniela Barros"
        },
        {
            texto: "Experiência incrível do começo ao fim.",
            autor: "— Thiago Cardoso"
        },
        {
            texto: "Ideal para quem busca exclusividade.",
            autor: "— Roberta Nunes"
        }
    ],

    "jardim-das-flores": [
        {
            texto: "O jardim tornou nossa cerimônia ainda mais especial.",
            autor: "— Beatriz Campos"
        },
        {
            texto: "Ambiente acolhedor e muito bem cuidado.",
            autor: "— Henrique Moreira"
        },
        {
            texto: "Voltaria novamente sem pensar duas vezes.",
            autor: "— Gabriela Teixeira"
        }
    ]

};

let indiceAtual = 0;

function mostrarAvaliacao() {

    const espaco = document.body.dataset.espaco;

    if (!espaco || !bancoAvaliacoes[espaco]) return;

    const lista = bancoAvaliacoes[espaco];

    document.getElementById("texto-avaliacao").textContent =
        lista[indiceAtual].texto;

    document.getElementById("autor-avaliacao").textContent =
        lista[indiceAtual].autor;
}

function proximaAvaliacao() {

    const espaco = document.body.dataset.espaco;
    const lista = bancoAvaliacoes[espaco];

    indiceAtual = (indiceAtual + 1) % lista.length;

    mostrarAvaliacao();
}

function avaliacaoAnterior() {

    const espaco = document.body.dataset.espaco;
    const lista = bancoAvaliacoes[espaco];

    indiceAtual = (indiceAtual - 1 + lista.length) % lista.length;

    mostrarAvaliacao();
}

window.addEventListener("load", () => {

    if (document.getElementById("texto-avaliacao")) {
        mostrarAvaliacao();
    }

});