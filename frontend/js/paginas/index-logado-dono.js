/* ==========================================================================
   GOLDEN HALL - HOME DO PROPRIETÁRIO (paginas/dono/index-logado-dono.html)
   Página exclusiva de contas "proprietario". Busca o nome de quem está
   logado e os números reais de desempenho em GET /api/estatisticas-dono
   (espaços cadastrados, reservas pendentes e avaliação média recebida)
   pra desenhar o card "Seu desempenho".
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        window.location.href = '/frontend/index.html';
        return;
    }

    // Essa home foi pensada só pro proprietário - cliente que cair aqui
    // (ex: digitando a URL direto) volta pra home dele
    if (usuario.tipo !== 'proprietario') {
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    document.getElementById('saudacao-nome').textContent = usuario.nome.split(' ')[0];

    carregarFotoPerfil();
    carregarEstatisticas();
    ativarHeaderSomeAoRolar();
});

// A foto não vem no usuário salvo no localStorage (login/cadastro não
// devolvem essa coluna) - por isso busca certinho em GET /api/perfil, que
// já é a mesma rota usada pra editar/mostrar a foto em perfil-dono.html.
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
        const estatisticas = await chamarAPI('/api/estatisticas-dono');
        preencherEstatisticas(estatisticas);
    } catch (erro) {
        console.error('Erro ao carregar estatísticas:', erro);
    }
}

// Esconde o cabeçalho ao rolar pra baixo e mostra de novo ao rolar pra cima
// (mesmo comportamento da home do cliente - ver index-logado.js)
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
// proporcional ao maior valor entre os 3 (senão um proprietário com 1
// espaço e 8 reservas pendentes teria as duas barras do mesmo tamanho).
// A avaliação média (0 a 5) entra na mesma conta normalmente, já que o
// objetivo é só comparar as barras entre si, não achar uma escala "certa".
function preencherEstatisticas(estatisticas) {
    const { total_espacos, reservas_pendentes, avaliacao_media, total_avaliacoes } = estatisticas;
    const media = avaliacao_media || 0;
    const maior = Math.max(total_espacos, reservas_pendentes, media, 1);

    definirBarra('espacos', total_espacos, maior, total_espacos);
    definirBarra('pendentes', reservas_pendentes, maior, reservas_pendentes);

    // Sem avaliação nenhuma ainda, mostra "-" em vez de "0.0" (0 sugeriria
    // uma nota ruim, quando na verdade é só a ausência de avaliações)
    const textoAvaliacao = total_avaliacoes > 0 ? media.toFixed(1) : '—';
    definirBarra('avaliacao', media, maior, textoAvaliacao);
}

function definirBarra(nome, valorNumerico, maior, textoExibido) {
    document.getElementById(`stat-${nome}`).textContent = textoExibido;

    const alturaMinima = 6; // % - pra barra não sumir totalmente quando valor é 0
    const altura = valorNumerico === 0 ? alturaMinima : Math.max(alturaMinima, (valorNumerico / maior) * 100);
    document.getElementById(`barra-${nome}`).style.height = `${altura}%`;
}
