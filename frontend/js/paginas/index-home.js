/* ==========================================================================
   GOLDEN HALL - LÓGICA ESPECÍFICA DA HOME PÚBLICA (index.html)
   Só o botão de seta do mockup "Veja como seu espaço vai aparecer" - alterna
   entre o card de anúncio e o preview da página de detalhes, mostrando só
   um dos dois por vez no mesmo lugar.
   ========================================================================== */

function alternarPreviewAnuncio() {
    const anuncio = document.getElementById('preview-anuncio');
    const detalhe = document.getElementById('preview-detalhe');
    const botao = document.getElementById('btn-alternar-preview');
    if (!anuncio || !detalhe || !botao) return;

    const icone = botao.querySelector('.material-icons-round');
    const mostrandoAnuncio = anuncio.style.display !== 'none';

    if (mostrandoAnuncio) {
        anuncio.style.display = 'none';
        detalhe.style.display = 'block';
        icone.textContent = 'arrow_back';
        botao.title = 'Ver como aparece na busca';
    } else {
        anuncio.style.display = 'block';
        detalhe.style.display = 'none';
        icone.textContent = 'arrow_forward';
        botao.title = 'Ver a página de detalhes';
    }
}
