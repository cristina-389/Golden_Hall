/* ==========================================================================
   GOLDEN HALL - PÁGINA DE DÚVIDAS (acordeão)
   Cada pergunta é um botão - clicar nela alterna a classe "aberta" no
   card, que é o que o CSS usa pra mostrar/esconder a resposta e girar a
   seta. Cada pergunta abre/fecha de forma independente das outras.
   ========================================================================== */
function alternarFaq(botaoPergunta) {
    const item = botaoPergunta.closest('.faq-item');
    if (item) item.classList.toggle('aberta');
}
