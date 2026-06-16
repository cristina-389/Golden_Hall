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