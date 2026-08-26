/* ==========================================================================
   GOLDEN HALL - HOME DO PROPRIETÁRIO (paginas/dono/index-logado-dono.html)
   Página exclusiva de contas "proprietario". Busca o nome de quem está
   logado, os números-resumo em GET /api/estatisticas-dono (espaços
   cadastrados, reservas pendentes, avaliação média) e o gráfico de linhas
   em GET /api/estatisticas-dono/grafico (uma linha por espaço, com o total
   acumulado de visualizações+reservas+favoritos+avaliações dia a dia nos
   últimos 30 dias) pra desenhar o card "Seu desempenho".
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
    carregarResumoNumeros();
    carregarGraficoEspacos();
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

// Os 3 números rápidos no topo do card (não fazem parte do gráfico de linhas)
async function carregarResumoNumeros() {
    try {
        const estatisticas = await chamarAPI('/api/estatisticas-dono');
        document.getElementById('stat-espacos').textContent = estatisticas.total_espacos;
        document.getElementById('stat-pendentes').textContent = estatisticas.reservas_pendentes;
        document.getElementById('stat-avaliacao').textContent =
            estatisticas.total_avaliacoes > 0 ? Number(estatisticas.avaliacao_media).toFixed(1) : '—';

        // Destaca "Reservas pendentes" com uma cor de alerta quando tem
        // alguma esperando resposta - é o número mais acionável dos 3
        document.getElementById('resumo-pendentes').classList.toggle('tem-pendencia', estatisticas.reservas_pendentes > 0);
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

/* ==========================================================================
   GRÁFICO DE LINHAS - "Evolução dos seus espaços"
   Desenhado à mão com SVG (sem biblioteca de gráficos) - uma <polyline> por
   espaço do proprietário, cada uma com uma cor diferente.
   ========================================================================== */

const CORES_LINHAS = ['#d4a437', '#5b8ff9', '#e8684a', '#5ad8a6', '#9270ca', '#f6bd16'];

async function carregarGraficoEspacos() {
    try {
        const dados = await chamarAPI('/api/estatisticas-dono/grafico');
        desenharGraficoEspacos(dados);
    } catch (erro) {
        console.error('Erro ao carregar gráfico de espaços:', erro);
    }
}

function desenharGraficoEspacos(dados) {
    const container = document.getElementById('grafico-linhas-espacos');
    const legenda = document.getElementById('legenda-grafico-espacos');
    container.innerHTML = '';
    legenda.innerHTML = '';

    if (dados.espacos.length === 0) {
        container.innerHTML = '<p class="grafico-vazio">Cadastre um espaço pra começar a acompanhar o desempenho dele aqui.</p>';
        return;
    }

    const largura = 600;
    const altura = 220;
    const margem = { topo: 15, baixo: 25, esquerda: 28, direita: 10 };
    const areaLargura = largura - margem.esquerda - margem.direita;
    const areaAltura = altura - margem.topo - margem.baixo;

    const qtdDias = dados.dias.length;
    const maiorValor = Math.max(1, ...dados.espacos.flatMap(espaco => espaco.pontos));

    const converterX = indice => margem.esquerda + (indice / (qtdDias - 1)) * areaLargura;
    const converterY = valor => margem.topo + areaAltura - (valor / maiorValor) * areaAltura;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
    svg.setAttribute('class', 'svg-grafico-linhas');

    // Linhas de grade horizontais + o número de cada uma (0%, 50%, 100% do maior valor)
    [0, 0.5, 1].forEach(fracao => {
        const py = margem.topo + areaAltura * (1 - fracao);

        const linhaGrade = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        linhaGrade.setAttribute('x1', margem.esquerda);
        linhaGrade.setAttribute('y1', py);
        linhaGrade.setAttribute('x2', largura - margem.direita);
        linhaGrade.setAttribute('y2', py);
        linhaGrade.setAttribute('class', 'linha-grade-grafico');
        svg.appendChild(linhaGrade);

        const textoY = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textoY.setAttribute('x', 0);
        textoY.setAttribute('y', py + 4);
        textoY.setAttribute('class', 'texto-eixo-grafico');
        textoY.textContent = Math.round(maiorValor * fracao);
        svg.appendChild(textoY);
    });

    // Uma <polyline> por espaço
    dados.espacos.forEach((espaco, indice) => {
        const cor = CORES_LINHAS[indice % CORES_LINHAS.length];
        const pontos = espaco.pontos.map((valor, i) => `${converterX(i)},${converterY(valor)}`).join(' ');

        const linha = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        linha.setAttribute('points', pontos);
        linha.setAttribute('class', 'linha-espaco-grafico');
        linha.setAttribute('stroke', cor);
        svg.appendChild(linha);
    });

    // Datas do primeiro e do último dia, nos dois cantos de baixo
    const textoInicio = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textoInicio.setAttribute('x', margem.esquerda);
    textoInicio.setAttribute('y', altura - 6);
    textoInicio.setAttribute('class', 'texto-eixo-grafico');
    textoInicio.textContent = formatarDataCurta(dados.dias[0]);
    svg.appendChild(textoInicio);

    const textoFim = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textoFim.setAttribute('x', largura - margem.direita);
    textoFim.setAttribute('y', altura - 6);
    textoFim.setAttribute('class', 'texto-eixo-grafico');
    textoFim.setAttribute('text-anchor', 'end');
    textoFim.textContent = formatarDataCurta(dados.dias[qtdDias - 1]);
    svg.appendChild(textoFim);

    container.appendChild(svg);

    // Legenda: um nome de espaço por linha, com uma bolinha da mesma cor -
    // textContent (não innerHTML) porque o nome do espaço vem de quem
    // cadastrou o espaço, então precisa da mesma prevenção contra XSS de sempre
    dados.espacos.forEach((espaco, indice) => {
        const item = document.createElement('div');
        item.className = 'legenda-item-grafico';

        const bolinha = document.createElement('span');
        bolinha.className = 'legenda-cor-grafico';
        bolinha.style.background = CORES_LINHAS[indice % CORES_LINHAS.length];

        item.appendChild(bolinha);
        item.appendChild(document.createTextNode(espaco.nome));
        legenda.appendChild(item);
    });
}

// "2026-08-25" -> "25/08"
function formatarDataCurta(dataISO) {
    const [, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}`;
}
