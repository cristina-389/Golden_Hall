/* ==========================================================================
   GOLDEN HALL - HOME DO CLIENTE (index-logado.html)
   Página exclusiva de contas "cliente". Busca o nome de quem está logado
   (já salvo no localStorage, sem precisar de pedido novo) e os números reais
   de atividade em GET /api/estatisticas (favoritos, reservas, visualizações
   de espaços e avaliações escritas) pra desenhar o card "Seu desenvolvimento".
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        window.location.href = '/frontend/index.html';
        return;
    }

    // Essa home foi pensada só pro cliente - quem tem conta de proprietário
    // ainda não tem uma home própria (fica pra quando as páginas dele forem
    // construídas), então por enquanto vai direto pro painel de espaços dele.
    if (usuario.tipo === 'proprietario') {
        window.location.href = '/frontend/paginas/dono/painel-dono.html';
        return;
    }

    document.getElementById('saudacao-nome').textContent = usuario.nome.split(' ')[0];

    carregarFotoPerfil();
    carregarEstatisticas();
    ativarHeaderSomeAoRolar();
});

// A foto não vem no usuário salvo no localStorage (login/cadastro não
// devolvem essa coluna) - por isso busca certinho em GET /api/perfil, que
// já é a mesma rota usada pra editar/mostrar a foto em perfil.html.
async function carregarFotoPerfil() {
    try {
        const perfil = await chamarAPI('/api/perfil');
        const icone = document.getElementById('saudacao-avatar-icone');
        const img = document.getElementById('saudacao-avatar-foto');

        if (perfil.foto) {
            img.src = perfil.foto;
            img.style.display = 'block';
            icone.style.display = 'none';
        }
    } catch (erro) {
        console.error('Erro ao carregar foto de perfil:', erro);
    }
}

async function carregarEstatisticas() {
    try {
        const estatisticas = await chamarAPI('/api/estatisticas');
        preencherEstatisticas(estatisticas);
    } catch (erro) {
        console.error('Erro ao carregar estatísticas:', erro);
    }
}

// Esconde o cabeçalho ao rolar pra baixo (abre mais espaço de tela pra ler
// o conteúdo) e mostra de novo assim que a pessoa rola um pouquinho pra
// cima - "scrollAtual > 80" evita esconder logo nos primeiros pixels, bem
// no topo da página, o que ficaria estranho.
function ativarHeaderSomeAoRolar() {
    const header = document.querySelector('header');
    if (!header) return;

    let ultimoScroll = window.scrollY;

    window.addEventListener('scroll', function () {
        const scrollAtual = window.scrollY;
        const rolandoParaBaixo = scrollAtual > ultimoScroll;

        if (rolandoParaBaixo && scrollAtual > 80) {
            header.classList.add('header-escondido');
        } else {
            header.classList.remove('header-escondido');
        }

        ultimoScroll = scrollAtual;
    });
}

// Preenche os números e a altura de cada barrinha do gráfico - a altura é
// proporcional ao maior valor entre os 4 (senão uma pessoa com 1 reserva e
// 40 visualizações teria as duas barras do mesmo tamanho). Uma altura
// mínima garante que a barra apareça mesmo quando o valor é 0.
function preencherEstatisticas(estatisticas) {
    const { favoritos, reservas, visualizacoes, comentarios } = estatisticas;
    const maior = Math.max(favoritos, reservas, visualizacoes, comentarios, 1);

    definirBarra('favoritos', favoritos, maior);
    definirBarra('reservas', reservas, maior);
    definirBarra('visualizacoes', visualizacoes, maior);
    definirBarra('comentarios', comentarios, maior);
}

function definirBarra(nome, valor, maior) {
    document.getElementById(`stat-${nome}`).textContent = valor;

    const alturaMinima = 6; // % - pra barra não sumir totalmente quando valor é 0
    const altura = valor === 0 ? alturaMinima : Math.max(alturaMinima, (valor / maior) * 100);
    document.getElementById(`barra-${nome}`).style.height = `${altura}%`;
}
