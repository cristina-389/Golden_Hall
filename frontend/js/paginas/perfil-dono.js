/* ==========================================================================
   GOLDEN HALL - PÁGINA DE PERFIL DO PROPRIETÁRIO (ligada na API de verdade)
   Busca os dados de quem está logado em GET /api/perfil e preenche a tela.
   O botão "Editar Dados" funciona como uma alternância (toggle): no primeiro
   clique, libera os campos pra digitar; no segundo clique, salva (PUT
   /api/perfil) e trava os campos de novo. O segundo card ("Meus Espaços")
   não é editável - é só uma lista de verdade dos espaços cadastrados
   (GET /api/meus-espacos, a mesma rota que o painel usa).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', carregarPerfil);

let emEdicao = false; // controla se os campos estão liberados pra digitar ou travados

async function carregarPerfil() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        alert('Você precisa entrar na sua conta para ver o perfil.');
        window.location.href = '/frontend/index.html';
        return;
    }

    // Essa página é a versão do proprietário - cliente que cair aqui (ex:
    // digitando a URL direto) vai pro perfil dele
    if (usuario.tipo !== 'proprietario') {
        window.location.href = '/frontend/paginas/cliente/perfil.html';
        return;
    }

    try {
        const dados = await chamarAPI('/api/perfil');
        preencherPerfil(dados);
    } catch (erro) {
        alert(erro.message);
    }

    carregarMeusEspacos();
}

// Escreve os dados do usuário na tela (cabeçalho + campos do formulário)
function preencherPerfil(usuario) {
    document.getElementById('perfil-nome-cabecalho').textContent = primeiroEUltimoNome(usuario.nome);
    document.getElementById('perfil-status-badge').textContent = 'Proprietário de Espaço ⚜️';

    document.getElementById('perfil-input-nome').value = usuario.nome;
    document.getElementById('perfil-input-email').value = usuario.email;
    document.getElementById('perfil-input-telefone').value = usuario.telefone || '';
    document.getElementById('perfil-input-cidade').value = usuario.cidade || '';

    exibirFotoPerfil(usuario.foto);
}

// "Cristina Gabriely Pinto Campos" -> "Cristina Campos" - só pro nome grande
// do cabeçalho (o campo "Nome Completo", que é editável, continua mostrando
// o nome inteiro)
function primeiroEUltimoNome(nomeCompleto) {
    const partes = nomeCompleto.trim().split(/\s+/);
    return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[partes.length - 1]}`;
}

// Card "Meus Espaços": lista de verdade (GET /api/meus-espacos), cada item
// já é um link pra ver como o espaço aparece pra um cliente de verdade.
async function carregarMeusEspacos() {
    const container = document.getElementById('perfil-lista-espacos');

    try {
        const espacos = await chamarAPI('/api/meus-espacos');

        if (espacos.length === 0) {
            const vazio = document.createElement('p');
            vazio.className = 'perfil-espacos-vazio';
            vazio.textContent = 'Você ainda não cadastrou nenhum espaço.';
            container.appendChild(vazio);
            return;
        }

        espacos.forEach(espaco => {
            const item = document.createElement('a');
            item.className = 'perfil-espaco-item';
            item.href = '/frontend/paginas/cliente/detalhes/detalhes.html?slug=' + espaco.slug;

            const icone = document.createElement('span');
            icone.className = 'material-icons-round';
            icone.textContent = 'storefront';

            const textos = document.createElement('div');
            textos.className = 'perfil-espaco-item-textos';

            const nome = document.createElement('strong');
            nome.textContent = espaco.nome; // textContent, não innerHTML - previne XSS

            const local = document.createElement('span');
            local.textContent = espaco.local || 'Local a definir';

            textos.appendChild(nome);
            textos.appendChild(local);
            item.appendChild(icone);
            item.appendChild(textos);
            container.appendChild(item);
        });
    } catch (erro) {
        console.error('Erro ao carregar meus espaços:', erro);
    }
}

// Guarda se já existe foto salva ou não - abrirModalFoto() usa isso pra
// decidir se mostra a opção "Remover Foto Atual"
let temFotoAtual = false;

// Alterna entre mostrar a <img> (quando existe foto salva) e o ícone
// genérico (quando não existe) - chamada tanto ao carregar a página quanto
// depois de trocar/remover a foto
function exibirFotoPerfil(foto) {
    const icone = document.getElementById('perfil-avatar-icone');
    const img = document.getElementById('perfil-avatar-foto');

    temFotoAtual = !!foto;

    if (foto) {
        img.src = foto;
        img.style.display = 'block';
        icone.style.display = 'none';
    } else {
        img.style.display = 'none';
        icone.style.display = 'block';
    }
}

// Abre a própria foto ampliada (clicando nela, não no botão de câmera) -
// só existe o <img> pra clicar quando já tem foto salva (ver
// exibirFotoPerfil() acima), então não precisa checar "tem foto" aqui
function abrirVisualizacaoFoto() {
    document.getElementById('imagem-visualizacao-foto').src = document.getElementById('perfil-avatar-foto').src;
    document.getElementById('modal-ver-foto').classList.add('ativo');
}

function fecharVisualizacaoFoto() {
    document.getElementById('modal-ver-foto').classList.remove('ativo');
}

window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('modal-ver-foto')) {
        fecharVisualizacaoFoto();
    }
});

// Modal "Foto de Perfil" (aberto pelo botão de câmera) - pergunta se a
// pessoa quer escolher da galeria, tirar uma foto na hora, ou remover a
// foto atual. A opção de remover só aparece se já tiver uma foto salva.
function abrirModalFoto() {
    document.getElementById('btn-opcao-remover-foto').style.display = temFotoAtual ? 'flex' : 'none';
    document.getElementById('modal-foto-perfil').classList.add('ativo');
}

function fecharModalFoto() {
    document.getElementById('modal-foto-perfil').classList.remove('ativo');
}

window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('modal-foto-perfil')) {
        fecharModalFoto();
    }
});

// "galeria" abre o seletor de arquivo normal; "camera" abre o modal com a
// câmera de verdade (ver abrirModalCamera() mais abaixo); "remover" chama
// removerFoto() direto, sem precisar escolher arquivo nenhum
function escolherOrigemFoto(origem) {
    fecharModalFoto();

    if (origem === 'remover') {
        removerFoto();
        return;
    }

    if (origem === 'camera') {
        abrirModalCamera();
        return;
    }

    document.getElementById('perfil-input-foto').click();
}

// Manda a foto (já em base64) pro back-end salvar e atualiza a tela e o
// localStorage - usado tanto por quem escolhe um arquivo (trocarFoto)
// quanto por quem tira a foto na hora (capturarFotoCamera)
async function salvarFotoBase64(fotoBase64) {
    try {
        const resultado = await chamarAPI('/api/perfil/foto', {
            method: 'PUT',
            body: JSON.stringify({ foto: fotoBase64 })
        });

        exibirFotoPerfil(resultado.foto);

        const usuarioLogado = obterUsuarioLogado();
        atualizarUsuarioLocal({ ...usuarioLogado, foto: resultado.foto });
    } catch (erro) {
        alert(erro.message || 'Não foi possível salvar a foto.');
    }
}

// Botão de câmera no avatar (opção "Escolher da Galeria") - lê a foto
// escolhida como base64 (FileReader) e redimensiona antes num <canvas> pra
// não mandar fotos de celular gigantes (vira alguns KB em vez de MB)
async function trocarFoto(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
        alert('Escolha um arquivo de imagem.');
        event.target.value = '';
        return;
    }

    const fotoRedimensionada = await redimensionarImagem(arquivo, 300);
    await salvarFotoBase64(fotoRedimensionada);
    event.target.value = ''; // permite escolher o mesmo arquivo de novo depois
}

async function removerFoto() {
    const certeza = confirm('Remover sua foto de perfil?');
    if (!certeza) return;

    try {
        await chamarAPI('/api/perfil/foto', {
            method: 'PUT',
            body: JSON.stringify({ foto: null })
        });

        exibirFotoPerfil(null);

        const usuarioLogado = obterUsuarioLogado();
        atualizarUsuarioLocal({ ...usuarioLogado, foto: null });
    } catch (erro) {
        alert(erro.message);
    }
}

/* ==========================================================================
   CÂMERA DE VERDADE (opção "Tirar uma Foto")
   Usa getUserMedia pra acessar a webcam/câmera do dispositivo de verdade,
   mostra o preview ao vivo num <video>, e "tira a foto" desenhando o
   frame atual num <canvas> - sem isso, o atributo "capture" do input de
   arquivo funciona só em celular (e olhe lá), não abre nenhuma câmera de
   verdade em computador.
   ========================================================================== */

let streamCameraAtual = null; // guarda o stream ativo pra poder desligar a câmera depois

async function abrirModalCamera() {
    document.getElementById('modal-camera-foto').classList.add('ativo');

    try {
        streamCameraAtual = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        document.getElementById('video-camera-foto').srcObject = streamCameraAtual;
    } catch (erro) {
        alert('Não foi possível acessar a câmera. Verifique se você deu permissão pro navegador usá-la.');
        fecharModalCamera();
    }
}

function fecharModalCamera() {
    document.getElementById('modal-camera-foto').classList.remove('ativo');

    // Desliga a câmera de verdade (senão a luzinha/indicador de câmera
    // ativa do dispositivo continuaria acesa mesmo com o modal fechado)
    if (streamCameraAtual) {
        streamCameraAtual.getTracks().forEach(faixa => faixa.stop());
        streamCameraAtual = null;
    }
}

window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('modal-camera-foto')) {
        fecharModalCamera();
    }
});

// Desenha o frame atual do vídeo num <canvas> (já no tamanho reduzido, igual
// redimensionarImagem faz pras fotos escolhidas por arquivo) e salva -
// desfaz o espelhamento do preview (que existe só pra parecer um espelho de
// verdade na tela), senão a foto salva sairia com tudo invertido
function capturarFotoCamera() {
    const video = document.getElementById('video-camera-foto');

    const tamanhoMaximo = 300;
    const escala = Math.min(1, tamanhoMaximo / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth * escala;
    canvas.height = video.videoHeight * escala;

    const contexto = canvas.getContext('2d');
    contexto.translate(canvas.width, 0);
    contexto.scale(-1, 1);
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    const fotoBase64 = canvas.toDataURL('image/jpeg', 0.85);

    fecharModalCamera();
    salvarFotoBase64(fotoBase64);
}

// Desenha a imagem escolhida num <canvas> menor (no máximo "tamanhoMaximo"
// de largura/altura) e devolve o resultado como base64 JPEG - assim uma
// foto de celular (que pode ter vários MB) vira um avatar leve antes de
// ser mandada pro servidor
function redimensionarImagem(arquivo, tamanhoMaximo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.onload = () => {
            const imagem = new Image();
            imagem.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
            imagem.onload = () => {
                const escala = Math.min(1, tamanhoMaximo / Math.max(imagem.width, imagem.height));
                const canvas = document.createElement('canvas');
                canvas.width = imagem.width * escala;
                canvas.height = imagem.height * escala;

                const contexto = canvas.getContext('2d');
                contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            imagem.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}

// Modal de "Alterar Senha" - só é oferecido enquanto a pessoa está editando
// os dados (ver alternarEdicaoPerfil() abaixo, que mostra/esconde o link
// que chama abrirModalTrocarSenha()).
function abrirModalTrocarSenha() {
    document.getElementById('modal-trocar-senha').classList.add('ativo');
}

function fecharModalTrocarSenha() {
    document.getElementById('modal-trocar-senha').classList.remove('ativo');
    document.getElementById('form-trocar-senha').reset();
}

// Clicar fora da caixa (no overlay escuro) fecha o modal, igual aos outros
// modais do site (ver window.addEventListener('click', ...) em js/modais.js)
window.addEventListener('click', function (event) {
    if (event.target === document.getElementById('modal-trocar-senha')) {
        fecharModalTrocarSenha();
    }
});

// Troca a senha de verdade (PUT /api/perfil/senha), que exige a senha atual
// como confirmação. Retorna "false" pro form não recarregar a página
// (equivalente a um event.preventDefault()).
async function alterarSenha(event) {
    event.preventDefault();

    const senhaAtual = document.getElementById('perfil-senha-atual').value;
    const senhaNova = document.getElementById('perfil-senha-nova').value;
    const senhaConfirmar = document.getElementById('perfil-senha-confirmar').value;

    if (senhaNova.length < 6) {
        alert('A nova senha precisa ter pelo menos 6 caracteres.');
        return false;
    }

    if (senhaNova !== senhaConfirmar) {
        alert('A confirmação não bate com a nova senha.');
        return false;
    }

    try {
        await chamarAPI('/api/perfil/senha', {
            method: 'PUT',
            body: JSON.stringify({ senhaAtual, novaSenha: senhaNova })
        });

        fecharModalTrocarSenha();
        alert('Senha alterada com sucesso!');
    } catch (erro) {
        alert(erro.message);
    }

    return false;
}

// Botão "Editar Dados" / "Salvar Dados" - a mesma função cuida dos dois
// estados, olhando a variável "emEdicao". O link "Alterar senha" só faz
// sentido junto do resto dos campos liberados pra edição, então aparece e
// some junto com eles.
function alternarEdicaoPerfil() {
    if (!emEdicao) {
        const inputNome = document.getElementById('perfil-input-nome');
        const inputTelefone = document.getElementById('perfil-input-telefone');
        const inputCidade = document.getElementById('perfil-input-cidade');

        inputNome.removeAttribute('readonly');
        inputTelefone.removeAttribute('readonly');
        inputCidade.removeAttribute('readonly');
        inputNome.focus();

        document.getElementById('btn-editar-dados').textContent = 'Salvar Dados';
        document.getElementById('btn-abrir-trocar-senha').style.display = 'flex';
        emEdicao = true;
        return;
    }

    salvarPerfil();
}

async function salvarPerfil() {
    const inputNome = document.getElementById('perfil-input-nome');
    const inputTelefone = document.getElementById('perfil-input-telefone');
    const inputCidade = document.getElementById('perfil-input-cidade');
    const botao = document.getElementById('btn-editar-dados');

    try {
        const usuarioAtualizado = await chamarAPI('/api/perfil', {
            method: 'PUT',
            body: JSON.stringify({ nome: inputNome.value, telefone: inputTelefone.value, cidade: inputCidade.value })
        });

        preencherPerfil(usuarioAtualizado);

        // Atualiza também a cópia guardada no localStorage, senão outras
        // páginas continuariam achando que o nome/telefone/cidade são os
        // antigos até a pessoa logar de novo
        atualizarUsuarioLocal(usuarioAtualizado);

        inputNome.setAttribute('readonly', true);
        inputTelefone.setAttribute('readonly', true);
        inputCidade.setAttribute('readonly', true);
        botao.textContent = 'Editar Dados';
        document.getElementById('btn-abrir-trocar-senha').style.display = 'none';
        emEdicao = false;

        alert('Dados atualizados com sucesso!');
    } catch (erro) {
        alert(erro.message);
    }
}
