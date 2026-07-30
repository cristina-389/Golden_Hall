/* ==========================================================================
   GOLDEN HALL - SISTEMA DE CONTROLE DE MODAIS (LOGIN / CADASTRO / AGENDA / RESERVA)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. MODAL DE CADASTRO
// --------------------------------------------------------------------------
function abrirModal() {
    const container = document.getElementById('container-modal-cadastro');
    if (!container) return;

    if (container.innerHTML === "") {
        let caminho = 'paginas/cadastro-modal.html';
        
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


// --------------------------------------------------------------------------
// 2. MODAL DE LOGIN
// --------------------------------------------------------------------------
function abrirModalLogin() {
    const container = document.getElementById('container-modal-login');
    if (!container) return;

    if (container.innerHTML === "") {
        let caminho = 'paginas/login-modal.html';
        
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


// --------------------------------------------------------------------------
// 3. MODAL DE AGENDA (CALENDÁRIO DE DISPONIBILIDADE)
// --------------------------------------------------------------------------
let dataAtualAgenda = new Date();

function abrirModalAgenda() {
    fecharModalReserva(); // Garante que a reserva feche caso esteja aberta
    
    const container = document.getElementById('container-modal-agenda');
    if (!container) return;

    if (container.innerHTML === "") {
        let caminho = 'paginas/agenda-modal.html';
        
        if (window.location.pathname.includes('/detalhes/')) {
            caminho = '../agenda-modal.html';
        } else if (window.location.pathname.includes('/paginas/')) {
            caminho = 'agenda-modal.html';
        }

        fetch(caminho)
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                setTimeout(() => {
                    document.getElementById('modal-agenda').classList.add('ativo');
                    gerarCalendario();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar a agenda:', erro));
    } else {
        document.getElementById('modal-agenda').classList.add('ativo');
        gerarCalendario();
    }
}

function fecharModalAgenda() {
    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.remove('ativo');
}

function mudarMes(delta) {
    dataAtualAgenda.setMonth(dataAtualAgenda.getMonth() + delta);
    gerarCalendario();
}

function gerarCalendario() {
    const gridDias = document.getElementById('grid-dias-mes');
    const txtMesAno = document.getElementById('mes-ano-atual');
    if (!gridDias || !txtMesAno) return;

    gridDias.innerHTML = '';

    const ano = dataAtualAgenda.getFullYear();
    const mes = dataAtualAgenda.getMonth();

    const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    txtMesAno.textContent = `${nomesMeses[mes]} ${ano}`;

    // Obtém o nome da página atual (ex: 'chacara-golden')
    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';

    // Recupera reservas do LocalStorage
    const reservasExistentes = JSON.parse(localStorage.getItem('gh_reservas')) || [];
    const datasOcupadas = reservasExistentes
        .filter(r => r.espaco === espacoAtual)
        .map(r => r.data);

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) {
        const divVazia = document.createElement('div');
        gridDias.appendChild(divVazia);
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const divDia = document.createElement('div');
        divDia.classList.add('dia-celula');
        divDia.textContent = dia;

        const mesFormatado = String(mes + 1).padStart(2, '0');
        const diaFormatado = String(dia).padStart(2, '0');
        const dataString = `${ano}-${mesFormatado}-${diaFormatado}`;

        if (datasOcupadas.includes(dataString)) {
            divDia.classList.add('ocupado');
            divDia.title = 'Data Indisponível';
        } else {
            divDia.classList.add('disponivel');
            divDia.onclick = () => selecionarDataEReservar(dataString);
        }

        gridDias.appendChild(divDia);
    }
}

function selecionarDataEReservar(dataString) {
    fecharModalAgenda();
    abrirModalReserva(dataString);
}


// --------------------------------------------------------------------------
// 4. MODAL DE SOLICITAÇÃO DE RESERVA
// --------------------------------------------------------------------------
function abrirModalReserva(dataPreSelecionada = null) {
    fecharModalAgenda();

    const container = document.getElementById('container-modal-reserva');
    if (!container) return;

    const aplicarDataERegra = () => {
        if (dataPreSelecionada) {
            const inputData = document.getElementById('reserva-data');
            if (inputData) inputData.value = dataPreSelecionada;
        }
        adicionarLogicaReserva();
    };

    if (container.innerHTML === "") {
        let caminho = 'paginas/reserva-modal.html';
        
        if (window.location.pathname.includes('/detalhes/')) {
            caminho = '../reserva-modal.html';
        } else if (window.location.pathname.includes('/paginas/')) {
            caminho = 'reserva-modal.html';
        }

        fetch(caminho)
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                setTimeout(() => {
                    document.getElementById('modal-reserva').classList.add('ativo');
                    aplicarDataERegra();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar a reserva:', erro));
    } else {
        document.getElementById('modal-reserva').classList.add('ativo');
        aplicarDataERegra();
    }
}

function fecharModalReserva() {
    const modal = document.getElementById('modal-reserva');
    if (modal) modal.classList.remove('ativo');
}

function adicionarLogicaReserva() {
    const form = document.getElementById('form-reserva');
    if (form && !form.dataset.listener) {
        form.dataset.listener = "true"; // Evita adicionar o evento múltiplas vezes

        form.addEventListener('submit', function(event) {
            event.preventDefault();

            const dataDigitada = document.getElementById('reserva-data').value;
            const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';

            const reservasExistentes = JSON.parse(localStorage.getItem('gh_reservas')) || [];

            // Validação de data indisponível
            const dataOcupada = reservasExistentes.some(r => r.espaco === espacoAtual && r.data === dataDigitada);

            if (dataOcupada) {
                alert('❌ Esta data já está ocupada para este espaço! Escolha outra data no calendário.');
                fecharModalReserva();
                abrirModalAgenda();
                return;
            }

            // Criação do registro
            const novaReserva = {
                id: 'reserva_' + Date.now(),
                espaco: espacoAtual,
                data: dataDigitada,
                horario: document.getElementById('reserva-horario').value,
                tipo: document.getElementById('reserva-tipo').value,
                convidados: document.getElementById('reserva-convidados').value,
                telefone: document.getElementById('reserva-telefone').value,
                obs: document.getElementById('reserva-obs')?.value || '',
                status: 'Pendente'
            };

            reservasExistentes.push(novaReserva);
            localStorage.setItem('gh_reservas', JSON.stringify(reservasExistentes));

            alert('✅ Solicitação de reserva realizada com sucesso!');
            fecharModalReserva();
        });
    }
}


// --------------------------------------------------------------------------
// 5. ATALHOS E EVENTOS DE FECHAMENTO
// --------------------------------------------------------------------------
function alternarParaCadastro() {
    fecharModalLogin();
    setTimeout(() => abrirModal(), 300);
}

function alternarParaLogin() {
    fecharModal();
    setTimeout(() => abrirModalLogin(), 300);
}

// Fecha qualquer modal ao clicar fora da caixa (no overlay)
window.addEventListener('click', function(event) {
    const modalCadastro = document.getElementById('modal-cadastro');
    const modalLogin = document.getElementById('modal-login');
    const modalAgenda = document.getElementById('modal-agenda');
    const modalReserva = document.getElementById('modal-reserva');
    
    if (event.target === modalCadastro) fecharModal();
    if (event.target === modalLogin) fecharModalLogin();
    if (event.target === modalAgenda) fecharModalAgenda();
    if (event.target === modalReserva) fecharModalReserva();
});





/* ==========================================================================
   GOLDEN HALL - SISTEMA DE CONTROLE DE MODAIS (LOGIN / CADASTRO)
   ========================================================================== *

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
});*/