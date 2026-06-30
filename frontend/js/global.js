/* ==========================================================================
   GOLDEN HALL - ARQUIVO GLOBAL (TEMAS E CONTROLE DE SESSÃO)
   ========================================================================== */

// Aplica o tema salvo assim que a estrutura da página carrega
document.addEventListener("DOMContentLoaded", function () {
    const body = document.body;
    const heroImg = document.getElementById("heroImg");
    const button = document.querySelector(".theme-toggle");

    // Recupera o tema salvo ou usa "dark" como padrão
    const theme = localStorage.getItem("theme") || "dark";

    if (theme === "light") {
        body.classList.remove("dark");
        if (heroImg) heroImg.src = "./Imagens/goldenhall-light.png";
        if (button) button.innerHTML = "☀️";
    } else {
        body.classList.add("dark");
        if (heroImg) heroImg.src = "./Imagens/goldenhall-dark.png";
        if (button) button.innerHTML = "🌙";
    }
});

// Função global para alternar o tema
function toggleTheme() {
    const body = document.body;
    const heroImg = document.getElementById("heroImg");
    const button = document.querySelector(".theme-toggle");

    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        if (heroImg) heroImg.src = "./Imagens/goldenhall-dark.png";
        if (button) button.innerHTML = "🌙";
    } else {
        localStorage.setItem("theme", "light");
        if (heroImg) heroImg.src = "./Imagens/goldenhall-light.png";
        if (button) button.innerHTML = "☀️";
    }
}

// Função global para deslogar o usuário de qualquer página
function confirmarSaida() {
    const certeza = confirm("Tem certeza que deseja sair da sua conta no Golden Hall?");
    if (certeza) {
        // Verifica se o arquivo está dentro de /paginas para ajustar o caminho de volta
        if (window.location.pathname.includes('/paginas/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}