/* ==========================================================================
   GOLDEN HALL - LÓGICA DA PÁGINA DE FAVORITOS (ligada na API de verdade)
   Busca os espaços favoritados em GET /api/favoritos (a API já devolve os
   dados de cada espaço, então não precisa de um pedido a mais por card).
   Usa chamarAPI(), formatarCapacidade() e formatarPreco(), que ficam no
   global.js (por isso ele precisa ser carregado ANTES deste arquivo).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', carregarFavoritos);

async function carregarFavoritos() {
    // #lista-favoritos = a div onde os cards (ou os benefícios) vão aparecer
    const container = document.getElementById('lista-favoritos');

    // #favoritos-vazio-hero = o coração + texto + botão que fica DENTRO do banner com foto
    const heroVazio = document.getElementById('favoritos-vazio-hero');

    if (!container) return; // segurança: se por algum motivo a div não existir, não faz nada

    // Essa página exige login - sem token, a API responderia 401
    if (!obterUsuarioLogado()) {
        if (heroVazio) heroVazio.style.display = 'none';
        container.innerHTML = `
            <div class="beneficios-favoritos" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="margin-bottom: 16px;">Entre na sua conta para ver e salvar seus espaços favoritos.</p>
                <button class="btn-explorar-favoritos" onclick="abrirModalLogin()"><i class="bi bi-box-arrow-in-right"></i> Entrar</button>
            </div>
        `;
        return;
    }

    let favoritos = [];
    try {
        favoritos = await chamarAPI('/api/favoritos');
    } catch (erro) {
        container.innerHTML = `<p style="text-align:center; padding: 40px;">${erro.message}</p>`;
        return;
    }

    // ---------- CASO 1: NÃO tem nenhum favorito salvo ----------
    if (favoritos.length === 0) {

        // Mostra o coração + texto + botão "Explorar Espaços" dentro do banner
        if (heroVazio) heroVazio.style.display = 'block';

        // Monta os 4 cards de benefício (Salve, Acesse, Receba novidades, Dados seguros)
        container.innerHTML = `
            <div class="beneficios-favoritos">
                <div class="beneficio-favorito">
                    <div class="icone-beneficio"><i class="bi bi-bookmark"></i></div>
                    <h4>Salve seus favoritos</h4>
                    <p>Guarde os espaços que você mais gostou.</p>
                </div>
                <div class="beneficio-favorito">
                    <div class="icone-beneficio"><i class="bi bi-heart"></i></div>
                    <h4>Acesse quando quiser</h4>
                    <p>Encontre facilmente seus locais preferidos.</p>
                </div>
                <div class="beneficio-favorito">
                    <div class="icone-beneficio"><i class="bi bi-bell"></i></div>
                    <h4>Receba novidades</h4>
                    <p>Seja avisado sobre promoções e novidades dos espaços.</p>
                </div>
                <div class="beneficio-favorito">
                    <div class="icone-beneficio"><i class="bi bi-shield-check"></i></div>
                    <h4>Seus dados seguros</h4>
                    <p>Suas informações estão sempre protegidas.</p>
                </div>
            </div>
        `;
        return; // encerra aqui, não precisa rodar o código dos cards de verdade
    }

    // ---------- CASO 2: TEM favoritos salvos ----------

    // Esconde o coração do banner, já que a lista não está mais vazia
    if (heroVazio) heroVazio.style.display = 'none';

    // Limpa o container antes de desenhar os cards de novo
    container.innerHTML = '';

    // Pra cada espaço favoritado, monta um card e adiciona na tela
    favoritos.forEach(espaco => {
        container.appendChild(criarCardFavorito(espaco));
    });
}

// Monta o card de um espaço favoritado. Usa textContent pro nome/local
// (não innerHTML) pelo mesmo motivo de buscar.js: evita que texto digitado
// por um dono vire HTML de verdade na página (XSS).
function criarCardFavorito(espaco) {
    const link = 'detalhes/detalhes.html?slug=' + espaco.slug;
    const imagem = espaco.imagem || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop';

    const card = document.createElement('div');
    card.className = 'card-favorito';
    card.innerHTML = `
        <div class="imagem-favorito">
            <img src="${imagem}">
            <button class="btn-remover-coracao" title="Remover dos favoritos">
                <i class="bi bi-heart-fill"></i>
            </button>
        </div>
        <div class="card-favorito-content">
            <h3></h3>
            <p><i class="bi bi-geo-alt"></i> <span class="texto-local"></span></p>
            <p><i class="bi bi-people"></i> ${formatarCapacidade(espaco.capacidade)}</p>
            <div class="card-favorito-preco">
                <small>A partir de</small> ${formatarPreco(espaco.preco)}
            </div>
            <button class="btn-ver-detalhes-favorito">Ver detalhes</button>
        </div>
    `;

    card.querySelector('img').alt = espaco.nome;
    card.querySelector('h3').textContent = espaco.nome;
    card.querySelector('.texto-local').textContent = espaco.local || 'Local a definir';
    card.querySelector('.btn-remover-coracao').addEventListener('click', () => removerDosFavoritos(espaco.slug));
    card.querySelector('.btn-ver-detalhes-favorito').addEventListener('click', () => { location.href = link; });

    return card;
}

// Remove um espaço da lista de favoritos (mesma rota que o coração das
// outras páginas usa - alternar quando já está favoritado sempre remove)
async function removerDosFavoritos(slug) {
    try {
        await chamarAPI('/api/favoritos/toggle', {
            method: 'POST',
            body: JSON.stringify({ espaco_slug: slug })
        });
        carregarFavoritos(); // redesenha a tela (se ficou vazia, já mostra o estado vazio automaticamente)
    } catch (erro) {
        alert(erro.message);
    }
}
