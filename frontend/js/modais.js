/* ==========================================================================
   GOLDEN HALL - SISTEMA DE CONTROLE DE MODAIS (LOGIN / CADASTRO / AGENDA / RESERVA)
   ========================================================================== */

// --------------------------------------------------------------------------
// 0. MODAL "COMO VOCÊ QUER USAR O GOLDEN HALL?"
// --------------------------------------------------------------------------
// Pergunta o tipo de conta ANTES de abrir o formulário de cadastro de
// verdade - só é usado quando isso ainda não é óbvio pelo contexto (ex: o
// botão genérico "Criar conta" do cabeçalho). Botões que já sabem a
// resposta (como "Cadastre seu espaço") continuam chamando
// abrirModal('proprietario') direto, sem passar por essa pergunta.
function abrirModalTipoConta() {
    const container = document.getElementById('container-modal-tipo-conta');
    if (!container) return;

    if (container.innerHTML === "") {
        fetch('/frontend/paginas/tipo-conta-modal.html')
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                setTimeout(() => {
                    const modal = document.getElementById('modal-tipo-conta');
                    if (modal) modal.classList.add('ativo');
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar a escolha de tipo de conta:', erro));
    } else {
        const modal = document.getElementById('modal-tipo-conta');
        if (modal) modal.classList.add('ativo');
    }
}

function fecharModalTipoConta() {
    const modal = document.getElementById('modal-tipo-conta');
    if (modal) modal.classList.remove('ativo');
}

// Ao escolher uma opção: fecha essa pergunta e abre o cadastro de verdade
// já com o tipo certo pré-selecionado (mesma função de sempre)
function escolherTipoConta(tipo) {
    fecharModalTipoConta();
    abrirModal(tipo);
}

// (o botão de "olhinho" dos campos de senha usa a função
// alternarVisibilidadeSenha(), que mora em global.js - assim a página de
// perfil, que tem seu próprio formulário de trocar senha mas não carrega
// este arquivo (que é só sobre modais), também consegue usá-la)

// --------------------------------------------------------------------------
// 1. MODAL DE CADASTRO
// --------------------------------------------------------------------------

// Abre o modal de cadastro. Como o HTML do modal fica num arquivo separado
// (cadastro-modal.html), a primeira vez que essa função roda ela precisa
// BUSCAR esse arquivo com fetch() e injetar o HTML dentro da div
// "container-modal-cadastro". Nas próximas vezes, o HTML já está ali dentro
// (container.innerHTML não está mais vazio), então só precisa mostrar o modal.
//
// "tipoPreSelecionado" é opcional: passe 'proprietario' (ex: botão "Cadastre
// seu espaço" na home) pra abrir o formulário já com essa opção marcada no
// campo "Quero me cadastrar como", em vez da pessoa ter que trocar na mão.
function abrirModal(tipoPreSelecionado = null) {
    const container = document.getElementById('container-modal-cadastro');
    if (!container) return;

    const aplicarTipoPreSelecionado = () => {
        if (!tipoPreSelecionado) return;
        const selectTipo = document.getElementById('cadastro-tipo-conta');
        if (selectTipo) selectTipo.value = tipoPreSelecionado;
    };

    if (container.innerHTML === "") {
        // Caminho ABSOLUTO (começando com "/frontend/") - funciona igual não
        // importa de qual página/pasta a função é chamada, porque não depende
        // de "quantos níveis subir" (../, ../../, etc.). O servidor Express
        // serve a pasta frontend/ inteira sob o prefixo "/frontend/" (ver
        // server.js), então esse caminho sempre aponta pro mesmo arquivo.
        fetch('/frontend/paginas/cadastro-modal.html')
            .then(resposta => resposta.text())
            .then(html => {
                container.innerHTML = html;
                // Pequeno delay pra garantir que o HTML novo já foi inserido no DOM
                // antes de tentar pegar o elemento #modal-cadastro por id
                setTimeout(() => {
                    const modal = document.getElementById('modal-cadastro');
                    if (modal) modal.classList.add('ativo'); // classe "ativo" é o que o CSS usa pra mostrar o modal na tela
                    adicionarValidacaoSenha();
                    aplicarTipoPreSelecionado();
                }, 50);
            })
            .catch(erro => console.error('Erro ao carregar o cadastro:', erro));
    } else {
        const modal = document.getElementById('modal-cadastro');
        if (modal) modal.classList.add('ativo');
        aplicarTipoPreSelecionado();
    }
}

// Esconde o modal de cadastro (só tira a classe "ativo", não remove o HTML)
function fecharModal() {
    const modal = document.getElementById('modal-cadastro');
    if (modal) modal.classList.remove('ativo');
}

// Liga o evento de "enviar formulário" do modal de cadastro: confere se as
// duas senhas digitadas são iguais e, se forem, manda os dados pra API criar
// a conta de verdade no banco (POST /api/cadastro).
//
// "async function" quer dizer que essa função PODE usar "await" - ou seja,
// pausar e esperar uma Promise (como o fetch dentro de chamarAPI) terminar
// antes de continuar pra próxima linha, em vez de sair executando tudo de
// uma vez sem esperar a resposta do servidor chegar.
function adicionarValidacaoSenha() {
    const form = document.getElementById('form-cadastro');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;

            if (senha.length < 6) {
                alert('A senha precisa ter pelo menos 6 caracteres.');
                return;
            }

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const telefone = document.getElementById('telefone').value;
            // Campo "Quero me cadastrar como" (cliente ou proprietário de espaço) - se o
            // formulário não tiver esse campo por algum motivo, cai em "cliente"
            const tipo = document.getElementById('cadastro-tipo-conta')?.value || 'cliente';

            try {
                // "try/catch": tenta rodar o código de dentro do try; se o
                // chamarAPI() der erro (ex: e-mail já cadastrado), o catch
                // pega esse erro em vez de quebrar a página inteira
                const dados = await chamarAPI('/api/cadastro', {
                    method: 'POST',
                    body: JSON.stringify({ nome, email, senha, telefone, tipo })
                });

                salvarSessao(dados.usuario, dados.token);
                fecharModal();
                window.location.href = caminhoHomeDoUsuario(dados.usuario);
            } catch (erro) {
                alert(erro.message);
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
        fetch('/frontend/paginas/login-modal.html')
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

// Liga o evento de "enviar formulário" do modal de login: manda email/senha
// pra API (POST /api/login) e só entra se ela confirmar que bate com uma
// conta de verdade no banco.
function adicionarLogicaLogin() {
    const form = document.getElementById('form-login');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            try {
                const dados = await chamarAPI('/api/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, senha })
                });

                salvarSessao(dados.usuario, dados.token);
                fecharModalLogin();
                window.location.href = caminhoHomeDoUsuario(dados.usuario);
            } catch (erro) {
                alert(erro.message);
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
        fetch('/frontend/paginas/cliente/agenda-modal.html')
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
// deixando clicáveis os dias livres. "async" porque agora busca as datas
// ocupadas na API em vez de ler do localStorage.
async function gerarCalendario() {
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

    // O slug do espaço atual já fica salvo em document.body.dataset.espaco
    // assim que a página de detalhes busca os dados na API (ver
    // carregarEspaco() em detalhes.js) - usamos o mesmo valor aqui.
    const espacoAtual = document.body.dataset.espaco;
    if (!espacoAtual) return;

    // Busca em GET /api/espacos/:slug/datas-ocupadas (rota pública) a lista
    // de datas que JÁ têm reserva pra este espaço específico
    let datasOcupadas = [];
    try {
        datasOcupadas = await chamarAPI(`/api/espacos/${espacoAtual}/datas-ocupadas`);
    } catch (erro) {
        console.error('Erro ao buscar datas ocupadas:', erro);
    }

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

// Botão "Reservar este espaço": só deixa passar pra tela de reserva quem já
// está logado (a API exige isso - ver middleware "autenticar" no back-end).
// Quem não está logado vê um aviso e cai direto no modal de login.
function iniciarReserva() {
    if (!obterUsuarioLogado()) {
        alert('Você precisa entrar (ou criar uma conta) antes de solicitar uma reserva.');
        abrirModalLogin();
        return;
    }
    abrirModalReserva();
}

// Abre o formulário de reserva. Se "dataPreSelecionada" for passada (vem do
// clique num dia do calendário), o campo de data do formulário já nasce
// preenchido com aquele dia. Mesma exigência de login do iniciarReserva()
// acima, porque dá pra chegar aqui direto pelo calendário também.
function abrirModalReserva(dataPreSelecionada = null) {
    if (!obterUsuarioLogado()) {
        fecharModalAgenda();
        alert('Você precisa entrar (ou criar uma conta) antes de solicitar uma reserva.');
        abrirModalLogin();
        return;
    }

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
        fetch('/frontend/paginas/cliente/reserva-modal.html')
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

// PASSO 1: Ao clicar em "Confirmar Solicitação" no Formulário.
// Só mostra o aviso da política de cancelamento - a reserva em si ainda
// não foi enviada pra API (isso só acontece depois, em confirmarReservaFinal()).
// A checagem de "essa data já está ocupada?" agora é feita pelo SERVIDOR no
// momento de salvar (ele conhece todas as reservas de verdade, não só o que
// está guardado neste navegador) - por isso não precisamos mais conferir
// isso aqui na mão.
function salvarReserva(event) {
    if (event) event.preventDefault(); // impede o formulário de recarregar a página

    // Esconde o modal de formulário de reserva e exibe o modal de alerta da política
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');

    if (modalReserva) modalReserva.classList.remove('ativo');
    if (modalAlerta) {
        modalAlerta.classList.add('ativo');
    } else {
        // Fallback caso o modal-alerta não esteja no HTML (evita travar o fluxo)
        if (confirm('Confirmar a solicitação de reserva?')) {
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
// Só AQUI a reserva é realmente enviada pra API (POST /api/reservas) e
// gravada no banco de dados de verdade.
async function confirmarReservaFinal() {
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');

    if (modalAlerta) modalAlerta.classList.remove('ativo');

    const dadosReserva = {
        espaco_slug: document.body.dataset.espaco,
        data: document.getElementById('reserva-data')?.value || '',
        horario: document.getElementById('reserva-horario')?.value || '',
        tipo_evento: document.getElementById('reserva-tipo')?.value || '',
        convidados: document.getElementById('reserva-convidados')?.value || '',
        telefone: document.getElementById('reserva-telefone')?.value || '',
        observacoes: document.getElementById('reserva-obs')?.value || ''
    };

    try {
        await chamarAPI('/api/reservas', {
            method: 'POST',
            body: JSON.stringify(dadosReserva)
        });

        // Exibe o modal de sucesso
        if (modalSucesso) {
            modalSucesso.classList.add('ativo');
        } else {
            // Fallback caso o modal-sucesso não esteja no HTML
            alert('✅ Solicitação enviada com sucesso!');
            window.location.href = '/frontend/paginas/cliente/reservas.html';
        }
    } catch (erro) {
        // Ex: "Essa data já está ocupada para este espaço" (409, quando duas
        // pessoas tentam reservar o mesmo dia quase ao mesmo tempo)
        alert('❌ ' + erro.message);
        fecharModalReserva();
        abrirModalAgenda(); // manda a pessoa de volta pro calendário escolher outra data
    }
}

// PASSO 3: Botão de ir para Minhas Reservas no Modal de Sucesso
function irParaMinhasReservas() {
    window.location.href = '/frontend/paginas/cliente/reservas.html';
}


// --------------------------------------------------------------------------
// 6. ATALHOS E EVENTOS DE FECHAMENTO
// --------------------------------------------------------------------------

// Troca do modal de login pro de cadastro (usado no link "Não tem conta? Cadastre-se") -
// passa primeiro pela pergunta de tipo de conta, já que aqui também não se
// sabe se a pessoa quer alugar ou anunciar um espaço
function alternarParaCadastro() {
    fecharModalLogin();
    setTimeout(() => abrirModalTipoConta(), 300); // pequeno delay pra esperar a animação de fechar terminar
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
    const modalTipoConta = document.getElementById('modal-tipo-conta');
    const modalCadastro = document.getElementById('modal-cadastro');
    const modalLogin = document.getElementById('modal-login');
    const modalAgenda = document.getElementById('modal-agenda');
    const modalReserva = document.getElementById('modal-reserva');
    const modalAlerta = document.getElementById('modal-alerta-cancelamento');
    const modalSucesso = document.getElementById('modal-sucesso-reserva');

    if (event.target === modalTipoConta) fecharModalTipoConta();
    if (event.target === modalCadastro) fecharModal();
    if (event.target === modalLogin) fecharModalLogin();
    if (event.target === modalAgenda) fecharModalAgenda();
    if (event.target === modalReserva) fecharModalReserva();
    if (event.target === modalAlerta) cancelarEVoltarReserva();
    if (event.target === modalSucesso) irParaMinhasReservas();
});
