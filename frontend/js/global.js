/* ==========================================================================
   GOLDEN HALL - ARQUIVO GLOBAL (TEMAS E CONTROLE DE SESSÃO)
   ========================================================================== */

// Aplica o tema salvo assim que a estrutura da página carrega.
// Esse bloco roda em TODAS as páginas (por isso "heroImg" e "button" podem
// não existir em algumas delas - só a index.html tem essa imagem/botão -
// e por isso sempre checamos "if (heroImg)" / "if (button)" antes de usar).
document.addEventListener("DOMContentLoaded", function () {
    const body = document.body;
    const heroImg = document.getElementById("heroImg"); // imagem grande que troca de cor conforme o tema (só existe na home)
    const button = document.querySelector(".theme-toggle"); // botão de sol/lua que troca o tema

    // Recupera o tema salvo ou usa "dark" como padrão (se for a primeira visita, ainda não tem nada salvo)
    const theme = localStorage.getItem("theme") || "dark";

    if (theme === "light") {
        body.classList.remove("dark"); // sem a classe "dark" o CSS já aplica as cores do tema claro
        if (heroImg) heroImg.src = "./Imagens/goldenhall-light.png";
        if (button) button.innerHTML = "☀️";
    } else {
        body.classList.add("dark");
        if (heroImg) heroImg.src = "./Imagens/goldenhall-dark.png";
        if (button) button.innerHTML = "🌙";
    }
});

// Função global para alternar o tema (chamada pelo onclick do botão de sol/lua)
function toggleTheme() {
    const body = document.body;
    const heroImg = document.getElementById("heroImg");
    const button = document.querySelector(".theme-toggle");

    body.classList.toggle("dark"); // inverte: se tinha a classe "dark", tira; se não tinha, coloca

    // Depois de trocar a classe, salva a escolha no localStorage pra lembrar na próxima visita
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

// Função global para deslogar o usuário de qualquer página (chamada pelo botão "Sair")
function confirmarSaida() {
    const certeza = confirm("Tem certeza que deseja sair da sua conta no Golden Hall?");
    if (certeza) {
        // Verifica se o arquivo está dentro de /paginas para ajustar o caminho de volta
        // (de dentro de /paginas precisa subir uma pasta com "../" pra chegar na index.html)
        if (window.location.pathname.includes('/paginas/')) {
            window.location.href = '../index.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

/* ==========================================================================
   GOLDEN HALL - CONTROLE DE FAVORITOS (localStorage)
   Adicione este bloco no FINAL do arquivo js/global.js já existente.
   Mesma lógica do gh_reservas que já é usado em reservas.js, só que
   guardando os espaços favoritados em vez das reservas.
   ========================================================================== */

// Lê a lista de favoritos salva no navegador. Se não existir nada ainda, retorna uma lista vazia.
function obterFavoritos() {
    return JSON.parse(localStorage.getItem('gh_favoritos')) || [];
}

// Salva a lista de favoritos inteira no navegador (sobrescreve a lista anterior)
function salvarFavoritos(favoritos) {
    localStorage.setItem('gh_favoritos', JSON.stringify(favoritos));
}

// Verifica se um espaço (pelo slug) já está favoritado ou não. Retorna true/false.
function isFavorito(slug) {
    return obterFavoritos().some(f => f.slug === slug);
}

// Adiciona OU remove um espaço dos favoritos (alterna: se já tem, tira; se não tem, coloca).
//
// dadosEspaco precisa ser um objeto assim:
// { slug, nome, imagem, local, capacidade, preco, link }
//
// "botao" é opcional: se você passar o botão que foi clicado, a função já troca
// o ícone dele (coração vazio <-> coração cheio) automaticamente.
function toggleFavorito(dadosEspaco, botao) {
    let favoritos = obterFavoritos();
    const jaFavoritado = favoritos.some(f => f.slug === dadosEspaco.slug);

    if (jaFavoritado) {
        // já estava favoritado -> remove da lista
        favoritos = favoritos.filter(f => f.slug !== dadosEspaco.slug);
    } else {
        // não estava favoritado -> adiciona na lista
        favoritos.push(dadosEspaco);
    }

    salvarFavoritos(favoritos);

    // Se um botão foi passado, atualiza o ícone dele na hora (sem precisar recarregar a página)
    if (botao) {
        atualizarIconeFavorito(botao, !jaFavoritado);
    }

    return !jaFavoritado; // retorna true se ACABOU de favoritar, false se acabou de desfavoritar
}

// Troca a aparência do botão de coração conforme está favoritado ou não
function atualizarIconeFavorito(botao, favoritado) {
    const icone = botao.querySelector('i'); // pega o <i> (ícone) dentro do botão

    if (favoritado) {
        botao.classList.add('favoritado');           // classe extra pra estilizar via CSS se quiser
        if (icone) {
            icone.classList.remove('bi-heart');       // troca coração vazio...
            icone.classList.add('bi-heart-fill');      // ...por coração cheio
        }
    } else {
        botao.classList.remove('favoritado');
        if (icone) {
            icone.classList.remove('bi-heart-fill');
            icone.classList.add('bi-heart');
        }
    }
}

// Assim que qualquer página carrega, procura todos os botões de favoritar que existem nela
// (ex: os cards do buscar.html) e já marca com o coração cheio os que já estão favoritados.
// Isso é o que faz o coração "lembrar" que já foi clicado, mesmo depois de recarregar a página.
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.btn-favoritar[data-slug]').forEach(botao => {
        const slug = botao.getAttribute('data-slug');
        if (isFavorito(slug)) {
            atualizarIconeFavorito(botao, true);
        }
    });
});