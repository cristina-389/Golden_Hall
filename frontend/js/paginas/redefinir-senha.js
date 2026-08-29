/* ==========================================================================
   GOLDEN HALL - REDEFINIÇÃO DE SENHA (paginas/redefinir-senha.html)
   Lê o token que veio na URL (?token=...) e manda, junto com a nova senha,
   pra POST /api/redefinir-senha. Sem token na URL a página nem deixa
   tentar - foi por um link de e-mail quebrado ou incompleto.
   ========================================================================== */

const conteudo = document.getElementById('redefinir-conteudo');
const token = new URLSearchParams(window.location.search).get('token');

if (!token) {
    conteudo.innerHTML = '<p class="subtitulo-form">Este link de redefinição está incompleto ou inválido. Solicite a recuperação de senha novamente.</p>';
} else {
    document.getElementById('form-redefinir-senha').addEventListener('submit', async function (event) {
        event.preventDefault();

        const novaSenha = document.getElementById('nova-senha').value;
        const confirmarNovaSenha = document.getElementById('confirmar-nova-senha').value;

        if (novaSenha.length < 6) {
            alert('A senha precisa ter pelo menos 6 caracteres.');
            return;
        }

        if (novaSenha !== confirmarNovaSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        try {
            const dados = await chamarAPI('/api/redefinir-senha', {
                method: 'POST',
                body: JSON.stringify({ token, novaSenha })
            });

            conteudo.innerHTML = `<p class="subtitulo-form">${dados.mensagem} Você já pode entrar com a nova senha.</p>`;
        } catch (erro) {
            alert(erro.message);
        }
    });
}
