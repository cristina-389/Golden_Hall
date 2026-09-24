/* ==========================================================================
   GOLDEN HALL - AVALIAÇÕES DE UM ESPAÇO, PRO DONO (paginas/dono/avaliacoes-espaco.html)
   Lê o "?slug=..." da URL (a página de Reservas já manda pra cá com o slug
   certo) e busca os dados reais em GET /api/espacos/:slug - mesma rota
   pública usada na página de detalhes do cliente, só que aqui só a parte
   de avaliações é aproveitada. estrelasParaTexto()/formatarDataAvaliacao()
   vêm de js/global.js.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = obterUsuarioLogado();
    if (!usuario || usuario.tipo !== 'proprietario') {
        alert('Esta área é exclusiva para contas de proprietário de espaço.');
        window.location.href = '/frontend/paginas/cliente/index-logado.html';
        return;
    }

    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) {
        window.location.href = '/frontend/paginas/dono/reservas-dono.html';
        return;
    }

    let espaco;
    try {
        espaco = await chamarAPI(`/api/espacos/${slug}`);
    } catch (erro) {
        alert('Não foi possível carregar esse espaço.');
        window.location.href = '/frontend/paginas/dono/reservas-dono.html';
        return;
    }

    document.getElementById('titulo-espaco-avaliacoes').textContent = espaco.nome;
    document.title = 'Avaliações de ' + espaco.nome + ' | Golden Hall';
    preencherAvaliacoesDono(espaco);
});

function preencherAvaliacoesDono(espaco) {
    const resumo = document.getElementById('resumo-avaliacoes');
    const lista = document.getElementById('lista-avaliacoes');
    lista.innerHTML = '';

    if (!espaco.total_avaliacoes) {
        resumo.innerHTML = '<p>Este espaço ainda não recebeu nenhuma avaliação.</p>';
        return;
    }

    const media = Number(espaco.media_avaliacoes);
    const textoTotal = espaco.total_avaliacoes === 1
        ? '1 avaliação'
        : `${espaco.total_avaliacoes} avaliações`;

    resumo.innerHTML = `
        <span class="estrelas">${estrelasParaTexto(media)}</span>
        <span>${media.toFixed(1)} de 5 · ${textoTotal}</span>
    `;

    espaco.avaliacoes.forEach(avaliacao => {
        const card = document.createElement('div');
        card.className = 'card-avaliacao';
        card.innerHTML = `
            <div class="card-avaliacao-topo">
                <span class="autor"></span>
                <span class="estrelas">${estrelasParaTexto(avaliacao.nota)}</span>
            </div>
            <p class="data"></p>
            <p class="comentario"></p>
        `;
        card.querySelector('.autor').textContent = avaliacao.cliente_nome;
        card.querySelector('.data').textContent = formatarDataAvaliacao(avaliacao.criado_em);
        card.querySelector('.comentario').textContent = avaliacao.comentario || '';
        lista.appendChild(card);
    });
}
