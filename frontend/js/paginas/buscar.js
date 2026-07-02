// Abre/fecha a gaveta de filtros
function toggleFiltros() {
    const painel = document.getElementById('painelFiltros');
    const chevron = document.getElementById('chevron-icon');
    
    painel.classList.toggle('ativo');
    chevron.style.transform = painel.classList.contains('ativo') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Limpa o que a pessoa escreveu
function limparFiltros() {
    document.getElementById('filtro-cidade').value = "";
    document.getElementById('filtro-evento').value = "";
    document.getElementById('filtro-capacidade').value = "";
    document.getElementById('filtro-preco').value = "";
    document.getElementById('filtro-avaliacao').value = "";
    
    // Esconde os resultados novamente ao limpar
    document.querySelector('.barra-resultados-info').style.display = "none";
    document.querySelector('.resultados-busca').style.display = "none";
}

// Filtra com base no que foi digitado e mostra os cards
function filtrarEspacos() {
    const buscaPrincipal = document.getElementById('input-busca').value.toLowerCase();
    const txtCidade = document.getElementById('filtro-cidade').value.toLowerCase();
    const txtEvento = document.getElementById('filtro-evento').value.toLowerCase();
    const numCapacidade = parseInt(document.getElementById('filtro-capacidade').value) || 0;
    const numPrecoMax = parseFloat(document.getElementById('filtro-preco').value) || Infinity;
    const numAvaliacaoMin = parseFloat(document.getElementById('filtro-avaliacao').value) || 0;

    const cards = document.querySelectorAll('.resultados-busca .card');
    let visiveis = 0;

    cards.forEach(card => {
        const tags = card.getAttribute('data-tags').toLowerCase();
        const cidadeCard = card.getAttribute('data-cidade').toLowerCase();
        const eventoCard = card.getAttribute('data-evento').toLowerCase();
        const capCard = parseInt(card.getAttribute('data-capacidade')) || 0;
        const precoCard = parseFloat(card.getAttribute('data-preco')) || 0;
        const avalCard = parseFloat(card.getAttribute('data-avaliacao')) || 0;

        // Comparações com o que foi escrito
        const bateBusca = buscaPrincipal === "" || tags.includes(buscaPrincipal);
        const bateCidade = txtCidade === "" || cidadeCard.includes(txtCidade);
        const bateEvento = txtEvento === "" || eventoCard.includes(txtEvento);
        const bateCapacidade = numCapacidade === 0 || capCard >= numCapacidade;
        const batePreco = precoCard <= numPrecoMax;
        const bateAvaliacao = avalCard >= numAvaliacaoMin;

        if (bateBusca && bateCidade && bateEvento && bateCapacidade && batePreco && bateAvaliacao) {
            card.style.display = "block";
            visiveis++;
        } else {
            card.style.display = "none";
        }
    });

    // MÁGICA: Mostra as seções de resultados que estavam escondidas no CSS
    document.querySelector('.barra-resultados-info').style.display = "flex";
    document.querySelector('.resultados-busca').style.display = "block";

    // Atualiza o número de espaços na tela
    document.getElementById('contador-cards').textContent = visiveis;
}

// Filtra com base no que foi digitado e mostra os resultados junto com o rodapé de ajuda
function filtrarEspacos() {
    const buscaPrincipal = document.getElementById('input-busca').value.toLowerCase();
    const txtCidade = document.getElementById('filtro-cidade').value.toLowerCase();
    const txtEvento = document.getElementById('filtro-evento').value.toLowerCase();
    const numCapacidade = parseInt(document.getElementById('filtro-capacidade').value) || 0;
    const numPrecoMax = parseFloat(document.getElementById('filtro-preco').value) || Infinity;
    const numAvaliacaoMin = parseFloat(document.getElementById('filtro-avaliacao').value) || 0;

    const cards = document.querySelectorAll('.resultados-busca .card');
    let visiveis = 0;

    cards.forEach(card => {
        const tags = card.getAttribute('data-tags').toLowerCase();
        const cidadeCard = card.getAttribute('data-cidade').toLowerCase();
        const eventoCard = card.getAttribute('data-evento').toLowerCase();
        const capCard = parseInt(card.getAttribute('data-capacidade')) || 0;
        const precoCard = parseFloat(card.getAttribute('data-preco')) || 0;
        const avalCard = parseFloat(card.getAttribute('data-avaliacao')) || 0;

        const bateBusca = buscaPrincipal === "" || tags.includes(buscaPrincipal);
        const bateCidade = txtCidade === "" || cidadeCard.includes(txtCidade);
        const bateEvento = txtEvento === "" || eventoCard.includes(txtEvento);
        const bateCapacidade = numCapacidade === 0 || capCard >= numCapacidade;
        const batePreco = precoCard <= numPrecoMax;
        const bateAvaliacao = avalCard >= numAvaliacaoMin;

        if (bateBusca && bateCidade && bateEvento && bateCapacidade && batePreco && bateAvaliacao) {
            card.style.display = "block";
            visiveis++;
        } else {
            card.style.display = "none";
        }
    });

    // Exibe o contador e o bloco de cards resultados
    document.querySelector('.barra-resultados-info').style.display = "flex";
    document.querySelector('.resultados-busca').style.display = "block";
    document.getElementById('contador-cards').textContent = visiveis;

    // MÁGICA: O alerta de "Não encontrou?" agora SEMPRE aparece junto com a busca
    document.getElementById('alerta-vazio').style.display = "block";
}

// Reseta completamente a tela para o estado original (sem buscas)
function limparFiltrosEComecar() {
    document.getElementById('input-busca').value = "";
    
    // Limpa os campos dos filtros avançados
    document.getElementById('filtro-cidade').value = "";
    document.getElementById('filtro-evento').value = "";
    document.getElementById('filtro-capacidade').value = "";
    document.getElementById('filtro-preco').value = "";
    document.getElementById('filtro-avaliacao').value = "";

    // Esconde tudo até que uma nova busca seja feita
    document.querySelector('.barra-resultados-info').style.display = "none";
    document.querySelector('.resultados-busca').style.display = "none";
    document.getElementById('alerta-vazio').style.display = "none";
    
    // Foca no campo de busca novamente
    document.getElementById('input-busca').focus();
}