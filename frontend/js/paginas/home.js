/* ==========================================================================
   GOLDEN HALL - CARDS DE ESPAÇOS EM DESTAQUE NA HOME PÚBLICA (index.html)
   Busca os espaços reais em GET /api/espacos (rota pública, não precisa de
   login) e desenha os cards. Se ainda não existir nenhum espaço cadastrado
   no banco, mostra uma mensagem em vez de uma seção vazia.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', carregarEspacosHome);

async function carregarEspacosHome() {
    const container = document.getElementById('cards-home');
    if (!container) return;

    let espacos = [];
    try {
        espacos = await chamarAPI('/api/espacos');
    } catch (erro) {
        container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center;">${erro.message}</p>`;
        return;
    }

    if (espacos.length === 0) {
        container.innerHTML = `
            <p style="grid-column: 1 / -1; text-align: center; opacity: .8;">
                Em breve, novos espaços incríveis por aqui! Volte mais tarde para conferir.
            </p>
        `;
        return;
    }

    container.innerHTML = '';
    espacos.forEach(espaco => container.appendChild(criarCardHome(espaco)));
}

// Usa textContent pro nome do espaço (não innerHTML) - mesma prevenção
// contra XSS já usada em buscar.js, favoritos.js e painel-dono.js
function criarCardHome(espaco) {
    const imagem = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop';
    const link = 'paginas/detalhes/detalhes.html?slug=' + espaco.slug;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${imagem}">
        <div class="card-content">
            <h3></h3>
            <p class="texto-local"></p>
            <p>${formatarCapacidade(espaco.capacidade)}</p>
            <div class="price">${formatarPreco(espaco.preco)}</div>
            <button>Ver detalhes</button>
        </div>
    `;

    card.querySelector('img').alt = espaco.nome;
    card.querySelector('h3').textContent = espaco.nome;
    card.querySelector('.texto-local').textContent = espaco.local || 'Local a definir';
    card.querySelector('button').addEventListener('click', () => { location.href = link; });

    return card;
}
