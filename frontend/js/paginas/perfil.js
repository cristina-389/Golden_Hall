/* ==========================================================================
   GOLDEN HALL - PÁGINA DE PERFIL (ligada na API de verdade)
   Busca os dados de quem está logado em GET /api/perfil e preenche a tela.
   O botão "Editar Dados" funciona como uma alternância (toggle): no primeiro
   clique, libera os campos pra digitar; no segundo clique, salva (PUT
   /api/perfil) e trava os campos de novo.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', carregarPerfil);

let emEdicao = false; // controla se os campos estão liberados pra digitar ou travados

async function carregarPerfil() {
    // Sem login, não tem perfil nenhum pra mostrar
    if (!obterUsuarioLogado()) {
        alert('Você precisa entrar na sua conta para ver o perfil.');
        window.location.href = '../index.html';
        return;
    }

    try {
        const usuario = await chamarAPI('/api/perfil');
        preencherPerfil(usuario);
    } catch (erro) {
        alert(erro.message);
    }
}

// Escreve os dados do usuário na tela (cabeçalho + campos do formulário)
function preencherPerfil(usuario) {
    document.getElementById('perfil-nome-cabecalho').textContent = usuario.nome;
    document.getElementById('perfil-status-badge').textContent =
        usuario.tipo === 'dono' ? 'Dono de Espaço ⚜️' : 'Cliente Golden Hall ⚜️';

    document.getElementById('perfil-input-nome').value = usuario.nome;
    document.getElementById('perfil-input-email').value = usuario.email;
    document.getElementById('perfil-input-telefone').value = usuario.telefone || '';
}

// Botão "Editar Dados" / "Salvar Dados" - a mesma função cuida dos dois
// estados, olhando a variável "emEdicao"
function alternarEdicaoPerfil() {
    if (!emEdicao) {
        const inputNome = document.getElementById('perfil-input-nome');
        const inputTelefone = document.getElementById('perfil-input-telefone');

        inputNome.removeAttribute('readonly');
        inputTelefone.removeAttribute('readonly');
        inputNome.focus();

        document.getElementById('btn-editar-dados').textContent = 'Salvar Dados';
        emEdicao = true;
        return;
    }

    salvarPerfil();
}

async function salvarPerfil() {
    const inputNome = document.getElementById('perfil-input-nome');
    const inputTelefone = document.getElementById('perfil-input-telefone');
    const botao = document.getElementById('btn-editar-dados');

    try {
        const usuarioAtualizado = await chamarAPI('/api/perfil', {
            method: 'PUT',
            body: JSON.stringify({ nome: inputNome.value, telefone: inputTelefone.value })
        });

        preencherPerfil(usuarioAtualizado);

        // Atualiza também a cópia guardada no localStorage, senão outras
        // páginas continuariam achando que o nome/telefone é o antigo até
        // a pessoa logar de novo
        atualizarUsuarioLocal(usuarioAtualizado);

        inputNome.setAttribute('readonly', true);
        inputTelefone.setAttribute('readonly', true);
        botao.textContent = 'Editar Dados';
        emEdicao = false;

        alert('Dados atualizados com sucesso!');
    } catch (erro) {
        alert(erro.message);
    }
}
