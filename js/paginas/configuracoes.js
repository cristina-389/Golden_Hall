/* ==========================================================================
   GOLDEN HALL - CONFIGURAÇÕES AVANÇADAS DA CONTA (cliente E proprietário)
   Usado por paginas/cliente/configuracoes.html e
   paginas/dono/configuracoes-dono.html - só tem a "zona de perigo" (excluir
   a conta, DELETE /api/perfil). Fica de propósito fora da tela principal
   do Perfil, atrás de um link discreto.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    if (!obterUsuarioLogado()) {
        window.location.href = '/frontend/index.html';
    }
});

function abrirModalExcluirConta() {
    document.getElementById('form-excluir-conta').reset();
    document.getElementById('modal-excluir-conta').classList.add('ativo');
}

function fecharModalExcluirConta() {
    document.getElementById('modal-excluir-conta').classList.remove('ativo');
}

window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('modal-excluir-conta')) {
        fecharModalExcluirConta();
    }
});

// Apaga a conta de vez (DELETE /api/perfil, que exige a senha atual como
// confirmação) - se for uma conta de proprietário, apaga junto todos os
// espaços cadastrados dela. Se der certo, encerra a sessão e manda pra
// home, igual um logout. O back-end recusa (409) se ainda tiver reserva
// pendente/aprovada em aberto - a mensagem de erro já explica o que fazer
// antes.
async function confirmarExclusaoConta(event) {
    event.preventDefault();

    const senha = document.getElementById('excluir-conta-senha').value;

    try {
        await chamarAPI('/api/perfil', {
            method: 'DELETE',
            body: JSON.stringify({ senha })
        });

        limparSessao();
        alert('Sua conta foi excluída. Sentiremos sua falta!');
        window.location.href = '/frontend/index.html';
    } catch (erro) {
        alert(erro.message);
    }

    return false;
}
