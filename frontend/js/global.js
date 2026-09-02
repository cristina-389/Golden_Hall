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
        // <html> também recebe a classe (além do <body>) porque a barra de
        // rolagem do navegador pertence a ele - variável CSS só desce de
        // pai pra filho, então um "dark" só no <body> nunca chegaria nela
        document.documentElement.classList.remove("dark");
        if (heroImg) heroImg.src = "./Imagens/goldenhall-light.png";
        if (button) button.innerHTML = "☀️";
    } else {
        body.classList.add("dark");
        document.documentElement.classList.add("dark");
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
    // Mantém o <html> sempre igual ao <body> (ver comentário acima, no DOMContentLoaded)
    document.documentElement.classList.toggle("dark", body.classList.contains("dark"));

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

// Botão de "olhinho" nos campos de senha (cadastro, login, e a troca de
// senha do perfil) - alterna o campo entre escondido (type="password") e
// visível (type="text"), e troca o ícone pra indicar o estado atual. Uma
// função só, reaproveitada por todos os campos - "idCampo" diz qual input
// alternar.
function alternarVisibilidadeSenha(idCampo, botao) {
    const campo = document.getElementById(idCampo);
    const icone = botao.querySelector('.bi');
    if (!campo || !icone) return;

    const estaEscondida = campo.type === 'password';
    campo.type = estaEscondida ? 'text' : 'password';
    icone.classList.toggle('bi-eye', !estaEscondida);
    icone.classList.toggle('bi-eye-slash', estaEscondida);
    botao.title = estaEscondida ? 'Esconder senha' : 'Mostrar senha';
}

// Função global para deslogar o usuário de qualquer página (chamada pelo botão "Sair")
function confirmarSaida() {
    const certeza = confirm("Tem certeza que deseja sair da sua conta no Golden Hall?");
    if (certeza) {
        limparSessao(); // apaga o token guardado - a partir daqui a pessoa não está mais "logada"
        window.location.href = '/frontend/index.html'; // caminho absoluto, funciona de qualquer página
    }
}

/* ==========================================================================
   SESSÃO DO USUÁRIO (login de verdade, ligado na API)
   Depois que a pessoa loga ou se cadastra, a API devolve um TOKEN (um
   "crachá" que prova quem ela é). Guardamos esse token aqui no localStorage
   pra não precisar pedir login de novo em toda página - e mandamos ele de
   volta em cada pedido que precisa saber "quem está logado".
   ========================================================================== */

// Chamada logo depois de um cadastro/login bem-sucedido
function salvarSessao(usuario, token) {
    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_usuario', JSON.stringify(usuario));
}

// Cada tipo de conta tem sua própria home - usado por js/modais.js pra
// mandar a pessoa pro lugar certo assim que ela cadastra/loga
function caminhoHomeDoUsuario(usuario) {
    return usuario.tipo === 'proprietario'
        ? '/frontend/paginas/dono/index-logado-dono.html'
        : '/frontend/paginas/cliente/index-logado.html';
}

// Retorna o token guardado, ou null se ninguém estiver logado
function obterToken() {
    return localStorage.getItem('gh_token');
}

// Retorna os dados (nome, email, tipo...) de quem está logado, ou null
function obterUsuarioLogado() {
    return JSON.parse(localStorage.getItem('gh_usuario')) || null;
}

// Atualiza só os DADOS guardados da sessão (token continua o mesmo) - usado
// depois de editar o perfil, pra obterUsuarioLogado() já devolver o nome/
// telefone novos sem precisar fazer login de novo
function atualizarUsuarioLocal(usuario) {
    localStorage.setItem('gh_usuario', JSON.stringify(usuario));
}

// Apaga a sessão (usado no logout)
function limparSessao() {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_usuario');
}

// Função auxiliar pra chamar a API sem repetir a mesma configuração toda
// vez: já manda o token de quem está logado (quando existir um) e já lê a
// resposta como JSON. Se a API responder com erro, "joga" (throw) esse erro
// pra quem chamou poder mostrar uma mensagem pro usuário.
//
// Uso: const espacos = await chamarAPI('/api/espacos');
//      const reserva = await chamarAPI('/api/reservas', { method: 'POST', body: JSON.stringify({...}) });
async function chamarAPI(caminho, opcoes = {}) {
    const token = obterToken();
    const cabecalhos = { 'Content-Type': 'application/json', ...opcoes.headers };
    if (token) cabecalhos.Authorization = `Bearer ${token}`;

    const resposta = await fetch(caminho, { ...opcoes, headers: cabecalhos });

    // 204 (No Content, usado no DELETE) não tem corpo pra converter em JSON
    const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

    if (!resposta.ok) {
        throw new Error((dados && dados.erro) || 'Erro ao falar com o servidor.');
    }

    return dados;
}

/* ==========================================================================
   GOLDEN HALL - CONTROLE DE FAVORITOS (ligado na API)
   Favoritar é diferente de reservar: não tem "disputa" (duas pessoas podem
   favoritar o mesmo espaço sem problema), mas ainda assim é "de alguém",
   então continua exigindo login - ver POST /api/favoritos/toggle.

   Como isFavorito() precisa responder na hora (sem "esperar" nada) toda
   vez que um card é desenhado, a gente busca a lista de favoritos UMA VEZ
   por página (atualizarCacheFavoritos()) e guarda aqui em "cacheFavoritos".
   Depois disso, isFavorito() só consulta esse array em memória.
   ========================================================================== */

let cacheFavoritos = null;

// Busca a lista de favoritos da API e guarda em cacheFavoritos. Precisa ser
// chamada (com "await") ANTES de qualquer isFavorito() na página - por isso
// tanto o DOMContentLoaded aqui embaixo quanto buscar.js/detalhes.js chamam
// essa função antes de desenhar os corações.
async function atualizarCacheFavoritos() {
    if (!obterUsuarioLogado()) {
        cacheFavoritos = [];
        return cacheFavoritos;
    }

    try {
        cacheFavoritos = await chamarAPI('/api/favoritos');
    } catch (erro) {
        console.error('Erro ao buscar favoritos:', erro);
        cacheFavoritos = [];
    }

    return cacheFavoritos;
}

// Verifica se um espaço (pelo slug) já está favoritado, olhando o cache em
// memória (não faz pedido nenhum pra API - por isso não precisa de "await")
function isFavorito(slug) {
    return (cacheFavoritos || []).some(espaco => espaco.slug === slug);
}

// Adiciona OU remove um espaço dos favoritos (o servidor decide qual dos
// dois, dependendo se já existia - ver POST /api/favoritos/toggle).
//
// "botao" é opcional: se você passar o botão que foi clicado, a função já
// troca o ícone dele (coração vazio <-> coração cheio) automaticamente.
async function toggleFavorito(dadosEspaco, botao) {
    if (!obterUsuarioLogado()) {
        alert('Você precisa entrar (ou criar uma conta) para favoritar um espaço.');
        abrirModalLogin();
        return;
    }

    try {
        const resultado = await chamarAPI('/api/favoritos/toggle', {
            method: 'POST',
            body: JSON.stringify({ espaco_slug: dadosEspaco.slug })
        });

        // Mantém o cache em memória sincronizado com o que o servidor confirmou
        if (resultado.favoritado) {
            cacheFavoritos = [...(cacheFavoritos || []), dadosEspaco];
        } else {
            cacheFavoritos = (cacheFavoritos || []).filter(espaco => espaco.slug !== dadosEspaco.slug);
        }

        if (botao) {
            atualizarIconeFavorito(botao, resultado.favoritado);
        }
    } catch (erro) {
        alert(erro.message);
    }
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

// Assim que qualquer página carrega, busca os favoritos (uma vez) e marca
// com o coração cheio os botões que já existem nela (ex: os cards do
// buscar.html). Páginas que desenham cards DEPOIS disso via JS (buscar.js,
// detalhes.js) chamam atualizarCacheFavoritos()/isFavorito() de novo por
// conta própria, já que esses botões nem existiam ainda nesse momento.
document.addEventListener('DOMContentLoaded', async function () {
    await atualizarCacheFavoritos();

    document.querySelectorAll('.btn-favoritar[data-slug]').forEach(botao => {
        const slug = botao.getAttribute('data-slug');
        if (isFavorito(slug)) {
            atualizarIconeFavorito(botao, true);
        }
    });

    ajustarNavegacaoParaDono();
});

// Contas do tipo "proprietario" não usam Favoritos/Reservas (isso é coisa de
// quem reserva espaços, não de quem os anuncia) - então, se quem está logado
// for um proprietário, troca o item "Favoritos" da barra inferior por "Meus
// Espaços" (link pro painel de gerenciamento) e remove o item "Reservas".
// Assim não precisa editar a barra de navegação, que é repetida em várias
// páginas - um lugar só (aqui) resolve pra todas elas de uma vez.
function ajustarNavegacaoParaDono() {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') return;

    // A própria página do painel já nasce com a barra correta - não mexe nela
    if (window.location.pathname.includes('painel-dono.html')) return;

    const nav = document.querySelector('.barra-navegacao-inferior');
    if (!nav) return;

    // Caminho absoluto - funciona de qualquer página, sem calcular "níveis"
    const caminhoPainel = '/frontend/paginas/dono/painel-dono.html';

    nav.querySelectorAll('.item-nav').forEach(item => {
        const icone = item.querySelector('.icone');
        if (!icone) return;

        if (icone.textContent.trim() === 'favorite') {
            icone.textContent = 'storefront';
            item.querySelector('.texto').textContent = 'Meus Espaços';
            item.setAttribute('href', caminhoPainel);
        } else if (icone.textContent.trim() === 'calendar_month') {
            item.remove();
        }
    });
}

/* ==========================================================================
   FORMATAÇÃO DE DADOS DE ESPAÇO (compartilhado entre buscar.js, detalhes.js
   e favoritos.js, pra não repetir a mesma lógica de texto em três lugares)
   ========================================================================== */

// Number -> "Até 150 pessoas" (ou "Sob consulta" se não tiver capacidade cadastrada)
function formatarCapacidade(capacidade) {
    return capacidade ? `Até ${capacidade} pessoas` : 'Sob consulta';
}

// Number -> "R$ 1.800" (ou "Sob consulta" se não tiver preço cadastrado)
function formatarPreco(preco) {
    return preco ? `R$ ${Number(preco).toLocaleString('pt-BR')}` : 'Sob consulta';
}

// Reserva -> "19:00 às 22:00" (com hora de término), "19:00" (sem hora de
// término, campo opcional) ou "-" (sem nem hora de início) - usado tanto na
// tela do proprietário (painel-dono.js) quanto em "Minhas Reservas" (reservas.js)
function formatarHorarioReserva(reserva) {
    if (!reserva.horario) return '-';
    return reserva.horario_termino ? `${reserva.horario} às ${reserva.horario_termino}` : reserva.horario;
}

/* ==========================================================================
   REDIMENSIONAMENTO DE IMAGEM (compartilhado entre perfil.js, perfil-dono.js
   e painel-dono.js) - lê o arquivo escolhido (FileReader), desenha num
   <canvas> menor (no máximo "tamanhoMaximo" de largura/altura) e devolve o
   resultado como base64 JPEG, assim uma foto de celular (que pode ter vários
   MB) fica bem mais leve antes de ser mandada pro servidor.
   ========================================================================== */
function redimensionarImagem(arquivo, tamanhoMaximo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.onload = () => {
            const imagem = new Image();
            imagem.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
            imagem.onload = () => {
                const escala = Math.min(1, tamanhoMaximo / Math.max(imagem.width, imagem.height));
                const canvas = document.createElement('canvas');
                canvas.width = imagem.width * escala;
                canvas.height = imagem.height * escala;

                const contexto = canvas.getContext('2d');
                contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            imagem.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}