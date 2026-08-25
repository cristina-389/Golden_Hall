/* ==========================================================================
   GOLDEN HALL - PÁGINA DE PERFIL DO PROPRIETÁRIO (ligada na API de verdade)
   Praticamente idêntica a js/paginas/perfil.js (a do cliente) - só não tem
   o campo "Preferência de Aluguel", que não existe nesta versão do HTML.
   Busca os dados de quem está logado em GET /api/perfil e preenche a tela.
   O botão "Editar Dados" funciona como uma alternância (toggle): no primeiro
   clique, libera os campos pra digitar; no segundo clique, salva (PUT
   /api/perfil) e trava os campos de novo.
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

    document.getElementById('perfil-stat-desde').textContent = formatarDataCompleta(usuario.criado_em);
    document.getElementById('perfil-input-bio').value = usuario.bio || '';
}

// "Cristina Gabriely Pinto Campos" -> "Cristina Campos" - só pro nome grande
// do cabeçalho (o campo "Nome Completo", que é editável, continua mostrando
// o nome inteiro)
function primeiroEUltimoNome(nomeCompleto) {
    const partes = nomeCompleto.trim().split(/\s+/);
    return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[partes.length - 1]}`;
}

// "2026-08-22 14:32:10" (formato que o SQLite grava em criado_em) -> "22 de agosto de 2026"
function formatarDataCompleta(dataTexto) {
    const data = new Date(dataTexto.replace(' ', 'T'));
    return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Alterna entre mostrar a <img> (quando existe foto salva) e o ícone
// genérico (quando não existe) - chamada tanto ao carregar a página quanto
// depois de trocar/remover a foto
function exibirFotoPerfil(foto) {
    const icone = document.getElementById('perfil-avatar-icone');
    const img = document.getElementById('perfil-avatar-foto');
    const botaoRemover = document.getElementById('btn-remover-foto');

    if (foto) {
        img.src = foto;
        img.style.display = 'block';
        icone.style.display = 'none';
        botaoRemover.style.display = 'inline-block';
    } else {
        img.style.display = 'none';
        icone.style.display = 'block';
        botaoRemover.style.display = 'none';
    }
}

// Botão de câmera no avatar - lê a foto escolhida como base64 (FileReader)
// e manda pro back-end salvar. Redimensiona antes num <canvas> pra não
// mandar fotos de câmera de celular gigantes (vira alguns KB em vez de MB)
async function trocarFoto(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
        alert('Escolha um arquivo de imagem.');
        event.target.value = '';
        return;
    }

    try {
        const fotoRedimensionada = await redimensionarImagem(arquivo, 300);

        const resultado = await chamarAPI('/api/perfil/foto', {
            method: 'PUT',
            body: JSON.stringify({ foto: fotoRedimensionada })
        });

        exibirFotoPerfil(resultado.foto);

        const usuarioLogado = obterUsuarioLogado();
        atualizarUsuarioLocal({ ...usuarioLogado, foto: resultado.foto });
    } catch (erro) {
        alert(erro.message || 'Não foi possível salvar a foto.');
    } finally {
        event.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    }
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

// Botão "Editar" / "Salvar" do card "Sobre Você" - mesmo esquema de
// alternância do card "Dados Pessoais", só que numa variável própria
// (emEdicaoSobre), já que os dois cards podem ser editados de forma
// independente. Aqui só existe o campo "Bio" (sem "Preferência de
// Aluguel", que é coisa de quem aluga espaço, não de quem anuncia).
let emEdicaoSobre = false;

function alternarEdicaoSobre() {
    if (!emEdicaoSobre) {
        const inputBio = document.getElementById('perfil-input-bio');

        inputBio.removeAttribute('readonly');
        inputBio.focus();

        document.getElementById('btn-editar-sobre').textContent = 'Salvar';
        emEdicaoSobre = true;
        return;
    }

    salvarSobre();
}

async function salvarSobre() {
    const inputBio = document.getElementById('perfil-input-bio');
    const botao = document.getElementById('btn-editar-sobre');

    try {
        const usuarioAtualizado = await chamarAPI('/api/perfil/sobre', {
            method: 'PUT',
            body: JSON.stringify({ bio: inputBio.value })
        });

        preencherPerfil(usuarioAtualizado);
        atualizarUsuarioLocal(usuarioAtualizado);

        inputBio.setAttribute('readonly', true);
        botao.textContent = 'Editar';
        emEdicaoSobre = false;

        alert('Perfil atualizado com sucesso!');
    } catch (erro) {
        alert(erro.message);
    }
}
