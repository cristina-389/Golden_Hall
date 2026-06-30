/* ==========================================================================
   GOLDEN HALL - FILTRAGEM INTELIGENTE DA ABA BUSCAR
   ========================================================================== */

   function filtrarEspacos() {
    const termoBusca = document.getElementById('input-busca').value.toLowerCase();
    const cards = document.querySelectorAll('.resultados-busca .card');

    cards.forEach(card => {
        const tags = card.getAttribute('data-tags') ? card.getAttribute('data-tags').toLowerCase() : '';
        if (tags.includes(termoBusca) || termoBusca === "") {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// Vincula o clique da tecla Enter à busca
document.addEventListener("DOMContentLoaded", function() {
    const inputBusca = document.getElementById('input-busca');
    if (inputBusca) {
        inputBusca.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                filtrarEspacos();
            }
        });
    }
});