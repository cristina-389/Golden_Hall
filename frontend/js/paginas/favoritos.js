/* ==========================================================================
   GOLDEN HALL - LÓGICA DA PÁGINA DE FAVORITOS
   ========================================================================== 
   Depende das funções obterFavoritos() e salvarFavoritos() que ficam
   no global.js (por isso o global.js precisa ser carregado ANTES
   deste arquivo no favoritos.html).
   ========================================================================== */

// Assim que a página termina de carregar, já busca e mostra os favoritos salvos
document.addEventListener('DOMContentLoaded', carregarFavoritos);

function carregarFavoritos() {
    // #lista-favoritos = a div onde os cards (ou os benefícios) vão aparecer
    const container = document.getElementById('lista-favoritos');

    // #favoritos-vazio-hero = o coração + texto + botão que fica DENTRO do banner com foto
    const heroVazio = document.getElementById('favoritos-vazio-hero');

    if (!container) return; // segurança: se por algum motivo a div não existir, não faz nada

    // Pega a lista de favoritos salva no localStorage (função vem do global.js)
    const favoritos = obterFavoritos();

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
        const cardHTML = `
            <div class="card-favorito">
                <div class="imagem-favorito">
                    <img src="${espaco.imagem}" alt="${espaco.nome}">

                    <!-- Clicar aqui chama removerDosFavoritos() passando o slug deste espaço -->
                    <button class="btn-remover-coracao" onclick="removerDosFavoritos('${espaco.slug}')" title="Remover dos favoritos">
                        <i class="bi bi-heart-fill"></i>
                    </button>
                </div>
                <div class="card-favorito-content">
                    <h3>${espaco.nome}</h3>
                    <p><i class="bi bi-geo-alt"></i> ${espaco.local}</p>
                    <p><i class="bi bi-people"></i> ${espaco.capacidade}</p>
                    <div class="card-favorito-preco">
                        <small>A partir de</small> ${espaco.preco}
                    </div>

                    <!-- Manda pra página de detalhes daquele espaço específico -->
                    <button class="btn-ver-detalhes-favorito" onclick="location.href='${espaco.link}'">Ver detalhes</button>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

// Remove um espaço da lista de favoritos pelo "slug" (identificador único, ex: 'chacara-golden')
function removerDosFavoritos(slug) {
    // Pega a lista atual de favoritos
    let favoritos = obterFavoritos();

    // Filtra removendo o espaço com esse slug (mantém todos os outros)
    favoritos = favoritos.filter(f => f.slug !== slug);

    // Salva a lista já sem esse espaço de volta no localStorage
    salvarFavoritos(favoritos);

    // Redesenha a tela (se ficou vazio, já mostra o estado vazio automaticamente)
    carregarFavoritos();
}