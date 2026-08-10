/* ==========================================================================
   GOLDEN HALL - SISTEMA DE CONTROLE DE MODAIS (LOGIN / CADASTRO / AGENDA / RESERVA)
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. MODAL DE CADASTRO
// --------------------------------------------------------------------------

// Abre o modal de cadastro. Como o HTML do modal fica num arquivo separado
// (cadastro-modal.html), a primeira vez que essa função roda ela precisa
// BUSCAR esse arquivo com fetch() e injetar o HTML dentro da div
// "container-modal-cadastro". Nas próximas vezes, o HTML já está ali dentro
// (container.innerHTML não está mais vazio), então só precisa mostrar o modal.
function abrirModal() {
    const container = document.getElementById('container-modal-cadastro');
    if (!container) return;

    if (container.innerHTML === "") {
        // O caminho até o cadastro-modal.html muda dependendo de quantas pastas
        // de profundidade a página atual está (ex: uma página dentro de
        // /paginas/detalhes/ precisa voltar menos "níveis" que a index.html na raiz).
        let caminho = 'paginas/cadastro-modal.html'; // caminho padrão: quando quem chamou está na raiz (index.html)

        if (window.location.pathname.includes('/detalhes/')) {
            caminho = '../cadastro-modal.html'; // está dentro de /paginas/detalhes/, então sobe 1 nível
        } else if (window.location.pathname.includes('/paginas/')) {
            caminho = 'cadastro-modal.html'; // já está dentro de /paginas/, então é só o nome do arquivo
        }

        fetch(caminho)
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                // Pequeno delay pra garantir que o HTML novo já foi inserido no DOM
                // antes de tentar pegar o elemento #modal-cadastro por id
                setTimeout(() => {
                    const modal = document.getElementById('modal-cadastro');
                    if (modal) modal.classList.add('ativo'); // classe "ativo" é o que o CSS usa pra mostrar o modal na tela
                    adicionarValidacaoSenha();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar o cadastro:', erro));
    } else {
        const modal = document.getElementById('modal-cadastro');
        if (modal) modal.classList.add('ativo');
    }
}

// Esconde o modal de cadastro (só tira a classe "ativo", não remove o HTML)
function fecharModal() {
    const modal = document.getElementById('modal-cadastro');
    if (modal) modal.classList.remove('ativo');
}

// Liga o evento de "enviar formulário" do modal de cadastro: confere se as
// duas senhas digitadas são iguais e, se forem, simula a criação da conta
// (esse projeto não tem back-end, então é só um alert + redirecionamento)
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

// Mesma lógica do abrirModal() (cadastro) explicada acima, só que
// carregando o arquivo login-modal.html dentro de #container-modal-login
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

// Liga o evento de "enviar formulário" do modal de login. Como não existe
// back-end, não valida usuário/senha de verdade: só simula o login e manda
// a pessoa pra index-logado.html (a versão do site de quem já está logado)
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
let dataAtualAgenda = new Date(); // guarda o mês/ano que está sendo exibido no calendário (começa no mês de hoje)

// Abre o calendário de disponibilidade do espaço. Segue o mesmo padrão de
// carregar o HTML por fetch() na primeira vez (ver abrirModal() acima).
function abrirModalAgenda() {
    fecharModalReserva(); // garante que o modal de reserva não fique aberto ao mesmo tempo

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

// Botões de "mês anterior" / "próximo mês": delta é -1 ou +1
function mudarMes(delta) {
    dataAtualAgenda.setMonth(dataAtualAgenda.getMonth() + delta);
    gerarCalendario(); // redesenha o calendário já no novo mês
}

// Monta visualmente o calendário do mês atual (dataAtualAgenda), marcando
// em vermelho/cinza os dias que já têm reserva feita para este espaço e
// deixando clicáveis os dias livres.
function gerarCalendario() {
    const gridDias = document.getElementById('grid-dias-mes');
    const txtMesAno = document.getElementById('mes-ano-atual');
    if (!gridDias || !txtMesAno) return;

    gridDias.innerHTML = ''; // limpa os dias do mês anterior antes de desenhar o novo

    const ano = dataAtualAgenda.getFullYear();
    const mes = dataAtualAgenda.getMonth();

    const nomesMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    txtMesAno.textContent = `${nomesMeses[mes]} ${ano}`;

    // Identifica de qual espaço é essa agenda pelo nome do arquivo da página atual
    // (ex: ".../chacara-golden.html" vira "chacara-golden"). Assim cada espaço
    // tem sua própria lista de datas ocupadas, mesmo usando o mesmo modal de agenda.
    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';

    // "gh_reservas" é a chave usada no localStorage para guardar TODAS as
    // reservas feitas no site (de todos os espaços). Aqui filtramos só as
    // datas que pertencem a este espaço específico.
    const reservasExistentes = JSON.parse(localStorage.getItem('gh_reservas')) || [];
    const datasOcupadas = reservasExistentes
        .filter(r => r.espaco === espacoAtual)
        .map(r => r.data);

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0=domingo ... 6=sábado
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate(); // truque: dia 0 do mês seguinte = último dia deste mês

    // Preenche células vazias antes do dia 1, só pra alinhar com o dia da semana correto na grade
    for (let i = 0; i < primeiroDiaSemana; i++) {
        const divVazia = document.createElement('div');
        gridDias.appendChild(divVazia);
    }

    // Cria uma célula pra cada dia do mês, marcando como ocupado ou disponível
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const divDia = document.createElement('div');
        divDia.classList.add('dia-celula');
        divDia.textContent = dia;

        // Monta a data no formato "AAAA-MM-DD" (mesmo formato salvo nas reservas)
        const mesFormatado = String(mes + 1).padStart(2, '0');
        const diaFormatado = String(dia).padStart(2, '0');
        const dataString = `${ano}-${mesFormatado}-${diaFormatado}`;

        if (datasOcupadas.includes(dataString)) {
            divDia.classList.add('ocupado');
            divDia.title = 'Data Indisponível';
        } else {
            divDia.classList.add('disponivel');
            divDia.onclick = () => selecionarDataEReservar(dataString); // clicar num dia livre já abre o formulário de reserva
        }

        gridDias.appendChild(divDia);
    }
}

// Ao clicar num dia livre do calendário: fecha a agenda e abre o formulário
// de reserva já com aquela data preenchida
function selecionarDataEReservar(dataString) {
    fecharModalAgenda();
    abrirModalReserva(dataString);
}


// --------------------------------------------------------------------------
// 4. MODAL DE SOLICITAÇÃO DE RESERVA
// --------------------------------------------------------------------------

// Abre o formulário de reserva. Se "dataPreSelecionada" for passada (vem do
// clique num dia do calendário), o campo de data do formulário já nasce
// preenchido com aquele dia.
function abrirModalReserva(dataPreSelecionada = null) {
    fecharModalAgenda();

    const container = document.getElementById('container-modal-reserva');
    if (!container) return;

    // Função auxiliar que preenche o campo de data (se houver uma pré-selecionada).
    // Fica separada porque precisa ser chamada tanto depois do fetch() na primeira
    // vez quanto direto nas próximas vezes (quando o HTML já está carregado).
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
// O fluxo completo é: formulário de reserva -> modal de alerta (avisando da
// política de cancelamento) -> só quando a pessoa confirma que está ciente
// é que a reserva é de fato gravada -> modal de sucesso.

// PASSO 1: Ao clicar em "Confirmar Solicitação" no Formulário
function salvarReserva(event) {
    if (event) event.preventDefault(); // impede o formulário de recarregar a página, já que não tem back-end

    const dataDigitada = document.getElementById('reserva-data')?.value;
    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';
    const reservasExistentes = JSON.parse(localStorage.getItem('gh_reservas')) || [];

    // Validação se a data já estiver ocupada (mesma checagem feita ao desenhar o calendário)
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
        // Fallback caso o modal-alerta não esteja no HTML (evita travar o fluxo)
        if (confirm('Atenção: Cancelamentos a menos de 7 dias possuem multa de 30%. Confirmar?')) {
            confirmarReservaFinal();
        }
    }
}

// Botão "CANCELAR" dentro do Modal de Alerta: desiste do aviso e volta pro formulário,
// sem cancelar nada de fato (a reserva ainda não tinha sido gravada)
function cancelarEVoltarReserva() {
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');

    if (modalAlerta) modalAlerta.classList.remove('ativo');
    if (modalReserva) modalReserva.classList.add('ativo'); // Volta para o formulário
}

// PASSO 2: Ao clicar em "ESTOU CIENTE, CONFIRMAR" no Modal de Alerta.
// Só AQUI a reserva é realmente gravada no localStorage.
function confirmarReservaFinal() {
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');

    if (modalAlerta) modalAlerta.classList.remove('ativo');

    // Captura os dados do formulário e grava um novo registro de reserva no localStorage.
    // "gh_reservas" guarda um array com TODAS as reservas de TODOS os espaços do site.
    let reservas = JSON.parse(localStorage.getItem('gh_reservas')) || [];
    const espacoAtual = window.location.pathname.split('/').pop().replace('.html', '') || 'geral';

    const novaReserva = {
        id: 'res_' + Date.now(), // id simples e único baseado no timestamp
        espaco: espacoAtual,
        data: document.getElementById('reserva-data')?.value || '',
        horario: document.getElementById('reserva-horario')?.value || '',
        tipo: document.getElementById('reserva-tipo')?.value || '',
        convidados: document.getElementById('reserva-convidados')?.value || '',
        telefone: document.getElementById('reserva-telefone')?.value || '',
        observacoes: document.getElementById('reserva-obs')?.value || '',
        status: 'Pendente', // status inicial de toda reserva nova (ver reservas.js pra saber onde isso é usado)
        dataSolicitacao: new Date().toLocaleDateString('pt-BR')
    };

    reservas.push(novaReserva);
    localStorage.setItem('gh_reservas', JSON.stringify(reservas));

    // Exibe o modal de sucesso
    if (modalSucesso) {
        modalSucesso.classList.add('ativo');
    } else {
        // Fallback caso o modal-sucesso não esteja no HTML
        alert('✅ Solicitação enviada com sucesso!');
        window.location.href = 'reservas.html';
    }
}

// PASSO 3: Botão de ir para Minhas Reservas no Modal de Sucesso
function irParaMinhasReservas() {
    window.location.href = '../reservas.html';
}


// --------------------------------------------------------------------------
// 6. MODAL DE GALERIA DE FOTOS
// --------------------------------------------------------------------------

// Abre a galeria com todas as fotos do espaço. Mesmo padrão de carregar o
// HTML por fetch() na primeira vez (ver abrirModal() acima). Quem monta as
// fotos de verdade é a função gerarGaleria(), definida em detalhes.js.
function abrirModalGaleria() {
    const container = document.getElementById('container-modal-galeria');
    if (!container) return;

    if (container.innerHTML === "") {
        let caminho = 'paginas/galeria-modal.html';

        if (window.location.pathname.includes('/detalhes/')) {
            caminho = '../galeria-modal.html';
        } else if (window.location.pathname.includes('/paginas/')) {
            caminho = 'galeria-modal.html';
        }

        fetch(caminho)
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                setTimeout(() => {
                    const modal = document.getElementById('modal-galeria');
                    if (modal) modal.classList.add('ativo');
                    gerarGaleria();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar a galeria:', erro));
    } else {
        const modal = document.getElementById('modal-galeria');
        if (modal) modal.classList.add('ativo');
        gerarGaleria();
    }
}

function fecharModalGaleria() {
    const modal = document.getElementById('modal-galeria');
    if (modal) modal.classList.remove('ativo');
}


// --------------------------------------------------------------------------
// 7. ATALHOS E EVENTOS DE FECHAMENTO
// --------------------------------------------------------------------------

// Troca do modal de login pro de cadastro (usado no link "Não tem conta? Cadastre-se")
function alternarParaCadastro() {
    fecharModalLogin();
    setTimeout(() => abrirModal(), 300); // pequeno delay pra esperar a animação de fechar terminar
}

// Troca do modal de cadastro pro de login (usado no link "Já tem conta? Entrar")
function alternarParaLogin() {
    fecharModal();
    setTimeout(() => abrirModalLogin(), 300);
}

// Fecha qualquer modal ao clicar fora da caixa (no overlay escuro por trás dele).
// Funciona porque o "event.target" só é o próprio elemento do modal (que ocupa
// a tela toda) quando o clique foi na área vazia, e não em algum filho dele.
window.addEventListener('click', function(event) {
    const modalCadastro = document.getElementById('modal-cadastro');
    const modalLogin = document.getElementById('modal-login');
    const modalAgenda = document.getElementById('modal-agenda');
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');
    const modalGaleria = document.getElementById('modal-galeria');

    if (event.target === modalCadastro) fecharModal();
    if (event.target === modalLogin) fecharModalLogin();
    if (event.target === modalAgenda) fecharModalAgenda();
    if (event.target === modalReserva) fecharModalReserva();
    if (event.target === modalAlerta) cancelarEVoltarReserva();
    if (event.target === modalSucesso) irParaMinhasReservas();
    if (event.target === modalGaleria) fecharModalGaleria();
});
