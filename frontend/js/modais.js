/* ==========================================================================
   GOLDEN HALL - SISTEMA DE CONTROLE DE MODAIS (LOGIN / CADASTRO)
   ========================================================================== */

// Gerenciamento do Modal de Cadastro com suporte a subpastas profundas
function abrirModal() {
    const container = document.getElementById('container-modal-cadastro');
    if (!container) return;

    if (container.innerHTML === "") {
        let caminho = 'paginas/cadastro-modal.html'; // Padrão para a raiz (index.html)
        
        // Se estiver na pasta /detalhes/ volta um nível (pois cadastro-modal está em /paginas/)
        if (window.location.pathname.includes('/detalhes/')) {
            caminho = '../cadastro-modal.html';
        } else if (window.location.pathname.includes('/paginas/')) {
            caminho = 'cadastro-modal.html';
        }

        fetch(caminho)
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                setTimeout(() => {
                    document.getElementById('modal-cadastro').classList.add('ativo');
                    adicionarValidacaoSenha();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar o cadastro:', erro));
    } else {
        document.getElementById('modal-cadastro').classList.add('ativo');
    }
}

function fecharModal() {
    const modal = document.getElementById('modal-cadastro');
    if (modal) modal.classList.remove('ativo');
}

function adicionarValidacaoSenha() {
    const form = document.getElementById('form-cadastro');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            fecharModal();
            alert('Conta criada com sucesso no Golden Hall!');
            
            // Redirecionamento inteligente pós-cadastro
            if (window.location.pathname.includes('/detalhes/')) {
                window.location.href = '../../index-logado.html';
            } else if (window.location.pathname.includes('/paginas/')) {
                window.location.href = '../index-logado.html';
            } else {
                window.location.href = 'index-logado.html';
            }
        });
    }
}

// Gerenciamento do Modal de Login com suporte a subpastas profundas
function abrirModalLogin() {
    const container = document.getElementById('container-modal-login');
    if (!container) return;

    if (container.innerHTML === "") {
        let caminho = 'paginas/login-modal.html'; // Padrão para a raiz (index.html)
        
        // Se estiver na pasta /detalhes/ volta um nível (pois login-modal está em /paginas/)
        if (window.location.pathname.includes('/detalhes/')) {
            caminho = '../login-modal.html';
        } else if (window.location.pathname.includes('/paginas/')) {
            caminho = 'login-modal.html';
        }

        fetch(caminho)
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                setTimeout(() => {
                    document.getElementById('modal-login').classList.add('ativo');
                    adicionarLogicaLogin();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar o login:', erro));
    } else {
        document.getElementById('modal-login').classList.add('ativo');
    }
}

function fecharModalLogin() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.remove('ativo');
}

function adicionarLogicaLogin() {
    const form = document.getElementById('form-login');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            fecharModalLogin();
            alert('Bem-vindo de volta ao Golden Hall!');
            
            // Redirecionamento inteligente pós-login
            if (window.location.pathname.includes('/detalhes/')) {
                window.location.href = '../../index-logado.html';
            } else if (window.location.pathname.includes('/paginas/')) {
                window.location.href = '../index-logado.html';
            } else {
                window.location.href = 'index-logado.html';
            }
        });
    }
}

// Atalhos para alternar entre as janelas
function alternarParaCadastro() {
    fecharModalLogin();
    setTimeout(() => abrirModal(), 300);
}

function alternarParaLogin() {
    fecharModal();
    setTimeout(() => abrirModalLogin(), 300);
}

// Fecha os modais se clicar no fundo desfocado
window.addEventListener('click', function(event) {
    const modalCadastro = document.getElementById('modal-cadastro');
    const modalLogin = document.getElementById('modal-login');
    
    if (event.target === modalCadastro) fecharModal();
    if (event.target === modalLogin) fecharModalLogin();
});