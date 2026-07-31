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
                    const modal = document.getElementById('modal-cadastro');
                    if (modal) modal.classList.add('ativo');
                    adicionarValidacaoSenha();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar o cadastro:', erro));
    } else {
        const modal = document.getElementById('modal-cadastro');
        if (modal) modal.classList.add('ativo');
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
                    const modal = document.getElementById('modal-login');
                    if (modal) modal.classList.add('ativo');
                    adicionarLogicaLogin();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar o login:', erro));
    } else {
        const modal = document.getElementById('modal-login');
        if (modal) modal.classList.add('ativo');
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
    fecharModalReserva();
    
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
                    const modal = document.getElementById('modal-agenda');
                    if (modal) modal.classList.add('ativo');
                    gerarCalendario();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar a agenda:', erro));
    } else {
        const modal = document.getElementById('modal-agenda');
        if (modal) modal.classList.add('ativo');
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

    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';

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
                    const modal = document.getElementById('modal-reserva');
                    if (modal) modal.classList.add('ativo');
                    aplicarDataERegra();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar a reserva:', erro));
    } else {
        const modal = document.getElementById('modal-reserva');
        if (modal) modal.classList.add('ativo');
        aplicarDataERegra();
    }
}

function fecharModalReserva() {
    const modal = document.getElementById('modal-reserva');
    if (modal) modal.classList.remove('ativo');
}


// --------------------------------------------------------------------------
// 5. FLUXO DE CONFIRMAÇÃO DA RESERVA (PASSO A PASSO COM ALERTA E SUCESSO)
// --------------------------------------------------------------------------

// PASSO 1: Ao clicar em "Confirmar Solicitação" no Formulário
function salvarReserva(event) {
    if (event) event.preventDefault();

    const dataDigitada = document.getElementById('reserva-data')?.value;
    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';
    const reservasExistentes = JSON.parse(localStorage.getItem('gh_reservas')) || [];

    // Validação se a data já estiver ocupada
    const dataOcupada = reservasExistentes.some(r => r.espaco === espacoAtual && r.data === dataDigitada);

    if (dataOcupada) {
        alert('❌ Esta data já está ocupada para este espaço! Escolha outra data no calendário.');
        fecharModalReserva();
        abrirModalAgenda();
        return;
    }

    // Esconde o modal de formulário de reserva e exibe o modal de alerta da política
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');

    if (modalReserva) modalReserva.classList.remove('ativo');
    if (modalAlerta) {
        modalAlerta.classList.add('ativo');
    } else {
        // Fallback caso o modal-alerta não esteja no HTML
        if (confirm('Atenção: Cancelamentos a menos de 7 dias possuem multa de 30%. Confirmar?')) {
            confirmarReservaFinal();
        }
    }
}

// Botão "CANCELAR" dentro do Modal de Alerta
function cancelarEVoltarReserva() {
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');

    if (modalAlerta) modalAlerta.classList.remove('ativo');
    if (modalReserva) modalReserva.classList.add('ativo'); // Volta para o formulário
}

// PASSO 2: Ao clicar em "ESTOU CIENTE, CONFIRMAR" no Modal de Alerta
function confirmarReservaFinal() {
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');

    if (modalAlerta) modalAlerta.classList.remove('ativo');

    // Captura os dados e grava no LocalStorage
    let reservas = JSON.parse(localStorage.getItem('gh_reservas')) || [];
    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';

    const novaReserva = {
        id: 'res_' + Date.now(),
        espaco: espacoAtual,
        data: document.getElementById('reserva-data')?.value || '',
        horario: document.getElementById('reserva-horario')?.value || '',
        tipo: document.getElementById('reserva-tipo')?.value || '',
        convidados: document.getElementById('reserva-convidados')?.value || '',
        telefone: document.getElementById('reserva-telefone')?.value || '',
        observacoes: document.getElementById('reserva-obs')?.value || '',
        status: 'Pendente',
        dataSolicitacao: new Date().toLocaleDateString('pt-BR')
    };

    reservas.push(novaReserva);
    localStorage.setItem('gh_reservas', JSON.stringify(reservas));

    // Exibe o modal de sucesso
    if (modalSucesso) {
        modalSucesso.classList.add('ativo');
    } else {
        alert('✅ Solicitação enviada com sucesso!');
        window.location.href = 'reservas.html';
    }
}

// PASSO 3: Botão de ir para Minhas Reservas no Modal de Sucesso
function irParaMinhasReservas() {
    window.location.href = '../reservas.html';
}


// --------------------------------------------------------------------------
// 6. ATALHOS E EVENTOS DE FECHAMENTO
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
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');
    
    if (event.target === modalCadastro) fecharModal();
    if (event.target === modalLogin) fecharModalLogin();
    if (event.target === modalAgenda) fecharModalAgenda();
    if (event.target === modalReserva) fecharModalReserva();
    if (event.target === modalAlerta) cancelarEVoltarReserva();
    if (event.target === modalSucesso) irParaMinhasReservas();
});


















/* ==========================================================================
   GOLDEN HALL - SISTEMA DE CONTROLE DE MODAIS (LOGIN / CADASTRO / AGENDA / RESERVA)
   ========================================================================== 

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


// Função chamada ao enviar o formulário do modal
function salvarReserva(event) {
    event.preventDefault(); // Impede o recarregamento automático da página

    // Pega a data digitada pelo usuário no formulário
    const inputData = document.getElementById('reserva-data');
    const dataDigitada = inputData ? inputData.value : '';
    
    // Formata a data para DD/MM/AAAA (padrão brasileiro)
    let dataFormatada = dataDigitada;
    if (dataDigitada && dataDigitada.includes('-')) {
        const partes = dataDigitada.split('-');
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // Mensagem com a política de cancelamento
    const mensagemConfirmacao = 
`📌 ATENÇÃO À POLÍTICA DE CANCELAMENTO

Sua solicitação de reserva para a data ${dataFormatada || 'selecionada'} está prestes a ser enviada!

Confirme se está ciente dos termos:
• Cancelamento 100% GRATUITO se realizado com até 7 dias de antecedência do evento.
• Cancelamentos com menos de 7 dias de antecedência terão taxa de rescisão de 30% sobre o valor total do agendamento.

Deseja concordar com os termos e confirmar a solicitação?`;

    // Exibe o alerta de confirmação. Se clicar em "OK", salva a reserva
    if (confirm(mensagemConfirmacao)) {
        processarESalvarReserva();
    }
}

// Função responsável por gravar no localStorage e ir para a página de reservas
function processarESalvarReserva() {
    let reservas = JSON.parse(localStorage.getItem('gh_reservas')) || [];

    // Tenta capturar o nome do espaço diretamente do título da página
    const tituloEspaco = document.querySelector('h1')?.textContent || 
                         document.querySelector('.titulo-espaco')?.textContent || 
                         'Chácara Golden';

    const novaReserva = {
        id: 'res_' + Date.now(),
        espaco: tituloEspaco.trim(),
        data: document.getElementById('reserva-data')?.value || '',
        horario: document.getElementById('reserva-horario')?.value || '',
        tipo: document.getElementById('reserva-tipo')?.value || '',
        convidados: document.getElementById('reserva-convidados')?.value || '',
        telefone: document.getElementById('reserva-telefone')?.value || '',
        observacoes: document.getElementById('reserva-obs')?.value || '',
        status: 'Pendente',
        dataSolicitacao: new Date().toLocaleDateString('pt-BR')
    };

    // Adiciona ao array e atualiza o localStorage
    reservas.push(novaReserva);
    localStorage.setItem('gh_reservas', JSON.stringify(reservas));

    alert('✅ Solicitação de reserva enviada com sucesso!');

    // Fecha o modal caso exista a função
    if (typeof fecharModalReserva === 'function') {
        fecharModalReserva();
    }
    
    // Redireciona para a página "Sua Reservas"
    window.location.href = 'reservas.html';
}

// PASSO 1: Ao clicar em "Confirmar Solicitação"
function salvarReserva(event) {
    if (event) event.preventDefault(); // Evita recarregar a página

    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');

    if (modalReserva) modalReserva.style.display = 'none';
    if (modalAlerta) {
        modalAlerta.style.display = 'flex';
    } else {
        alert('Erro: Modal de alerta (modal-alerta-cancelamento) não encontrado no HTML!');
    }
}

// Botão CANCELAR do Alerta
function cancelarEVoltarReserva() {
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');

    if (modalAlerta) modalAlerta.style.display = 'none';
    if (modalReserva) modalReserva.style.display = 'flex';
}

// PASSO 2: Ao clicar em "ESTOU CIENTE, CONFIRMAR"
function confirmarReservaFinal() {
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');

    if (modalAlerta) modalAlerta.style.display = 'none';

    // Salva no localStorage
    let reservas = JSON.parse(localStorage.getItem('gh_reservas')) || [];
    const novaReserva = {
        id: 'res_' + Date.now(),
        espaco: document.querySelector('h1')?.textContent || 'Chácara Golden',
        data: document.getElementById('reserva-data')?.value || '',
        horario: document.getElementById('reserva-horario')?.value || '',
        tipo: document.getElementById('reserva-tipo')?.value || '',
        convidados: document.getElementById('reserva-convidados')?.value || '',
        telefone: document.getElementById('reserva-telefone')?.value || '',
        observacoes: document.getElementById('reserva-obs')?.value || '',
        status: 'Pendente',
        dataSolicitacao: new Date().toLocaleDateString('pt-BR')
    };

    reservas.push(novaReserva);
    localStorage.setItem('gh_reservas', JSON.stringify(reservas));

    // Exibe o modal de Sucesso
    if (modalSucesso) {
        modalSucesso.style.display = 'flex';
    } else {
        alert('✅ Reserva Salva com sucesso!');
        window.location.href = 'reservas.html';
    }
}

// PASSO 3: Botão de ir para Minhas Reservas
function irParaMinhasReservas() {
    window.location.href = 'reservas.html';
}
*/



















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