// Aplica o tema salvo quando a página é carregada
//window.onload = function () {

  //const body = document.body;
  //const heroImg = document.getElementById("heroImg");
  //const button = document.querySelector(".theme-toggle");

  // Recupera o tema salvo ou usa "dark" como padrão
 // const theme = localStorage.getItem("theme") || "dark";

  //if (theme === "light") {
    //  body.classList.remove("dark");

    //  if (heroImg) {
        //  heroImg.src = "./Imagens/goldenhall-light.png";
      //}

     // if (button) {
       //   button.innerHTML = "☀️";
      //}

 // } else {
     // body.classList.add("dark");

      //if (heroImg) {
        //  heroImg.src = "./Imagens/goldenhall-dark.png";
     // }

     // if (button) {
        ///  button.innerHTML = "🌙";
    //  }
 // }
//};


// Função para trocar o tema
//function toggleTheme() {

 // const body = document.body;
  //const heroImg = document.getElementById("heroImg");
  //const button = document.querySelector(".theme-toggle");

 // body.classList.toggle("dark");

 // if (body.classList.contains("dark")) {

     // localStorage.setItem("theme", "dark");

    //  if (heroImg) {
        //  heroImg.src = "./Imagens/goldenhall-dark.png";
    //  }

      //if (button) {
        //  button.innerHTML = "🌙";
    //  }

  //} else {

     // localStorage.setItem("theme", "light");

      //if (heroImg) {
         // heroImg.src = "./Imagens/goldenhall-light.png";
      //}

     // if (button) {
        //  button.innerHTML = "☀️";
    //  }
 // }
//}

//const bancoAvaliacoes = {

   // "chacara-golden": [
     //   {
       //     texto: "A área verde é maravilhosa e tornou nossa confraternização inesquecível.",
         //   autor: "— Mariana Oliveira"
        //},
      //  {
         //   texto: "Lugar tranquilo, organizado e perfeito para eventos ao ar livre.",
           // autor: "— João Henrique"
       // },
       // {
           // texto: "Paisagem linda e excelente atendimento!",
           // autor: "— Fernanda Rocha"
       // }
   // ],

   // "salao-golden-luxo": [
       // {
          //  texto: "O salão superou todas as nossas expectativas.",
        //    autor: "— Ana Carolina"
       // },
      //  {
          //  texto: "Ambiente sofisticado e atendimento impecável.",
          //  autor: "— Felipe Martins"
      //  },
       // {
         //   texto: "Todos os convidados elogiaram o espaço.",
           // autor: "— Juliana Costa"
       // }
   // ],

   // "eventos-royal": [
       // {
           // texto: "Estrutura moderna e muito elegante.",
         //   autor: "— Lucas Ferreira"
        //},
        //{
          //  texto: "Excelente organização e decoração.",
          //  autor: "— Bruna Almeida"
       // },
       // {
         //   texto: "Perfeito para aniversários e eventos especiais.",
           // autor: "— Renato Silva"
       // }
    //],

    //"espaco-premium": [
      //  {
      //      texto: "Infraestrutura impecável e equipe muito profissional.",
        //    autor: "— Carla Menezes"
      //  },
       // {
         //   texto: "Tudo ocorreu exatamente como planejado.",
           // autor: "— Vinícius Lopes"
       // },
       // {
        //    texto: "Um espaço amplo e confortável para grandes eventos.",
          //  autor: "— Aline Freitas"
      //  }
  //  ],

   // "villa-imperial": [
      //  {
         //   texto: "Arquitetura encantadora e ambiente sofisticado.",
           // autor: "— Daniela Barros"
       // },
       // {
          //  texto: "Experiência incrível do começo ao fim.",
          //  autor: "— Thiago Cardoso"
       // },
       // {
           // texto: "Ideal para quem busca exclusividade.",
          //  autor: "— Roberta Nunes"
       // }
    //],

    //"jardim-das-flores": [
       // {
           // texto: "O jardim tornou nossa cerimônia ainda mais especial.",
          //  autor: "— Beatriz Campos"
       // },
       // {
        //    texto: "Ambiente acolhedor e muito bem cuidado.",
         //   autor: "— Henrique Moreira"
        //},
       // {
           // texto: "Voltaria novamente sem pensar duas vezes.",
           // autor: "— Gabriela Teixeira"
       // }
   // ]

//};

//let indiceAtual = 0;

//function mostrarAvaliacao() {

    //const espaco = document.body.dataset.espaco;

    //if (!espaco || !bancoAvaliacoes[espaco]) return;

   // const lista = bancoAvaliacoes[espaco];

   // document.getElementById("texto-avaliacao").textContent =
     //   lista[indiceAtual].texto;

   // document.getElementById("autor-avaliacao").textContent =
    //    lista[indiceAtual].autor;
//}

//function proximaAvaliacao() {

   // const espaco = document.body.dataset.espaco;
   // const lista = bancoAvaliacoes[espaco];

   // indiceAtual = (indiceAtual + 1) % lista.length;

   // mostrarAvaliacao();
//}

//function avaliacaoAnterior() {

   // const espaco = document.body.dataset.espaco;
   // const lista = bancoAvaliacoes[espaco];

   // indiceAtual = (indiceAtual - 1 + lista.length) % lista.length;

    //mostrarAvaliacao();
//}

//window.addEventListener("load", () => {

    //if (document.getElementById("texto-avaliacao")) {
    //    mostrarAvaliacao();
    //}

//});

// ============ Parte do cadastro =============== 
// Função para carregar o arquivo de cadastro e abrir na tela
//function abrirModal() {
    //const container = document.getElementById('container-modal-cadastro');

    // Se o modal ainda não foi carregado na página, busca o arquivo externo
   // if (container.innerHTML === "") {
       // fetch('paginas/cadastro-modal.html')
         //   .then(resposta => resposta.text())
          ///  .then(html => {
              //  container.innerHTML = html; // Insere o HTML isolado aqui dentro
                
                // Ativa o modal (efeito de desfoque e transição)
               // setTimeout(() => {
                //    document.getElementById('modal-cadastro').classList.add('ativo');
                   // adicionarValidacaoSenha(); // Ativa a checagem de senhas
              //  }, 50);
           // })
          //  .catch(erro => console.error('Erro ao carregar o cadastro:', erro));
    //} else {
        // Se já tinha sido carregado antes, apenas exibe novamente
       // document.getElementById('modal-cadastro').classList.add('ativo');
   // }
//}

//function fecharModal() {
  //  const modal = document.getElementById('modal-cadastro');
    //if (modal) modal.classList.remove('ativo');
//}

// Fecha se clicar fora da caixinha
//window.onclick = function(event) {
    //const modal = document.getElementById('modal-cadastro');
   // if (event.target === modal) {
      //  fecharModal();
   // }
//}

// Função isolada para validar as senhas após o formulário aparecer na tela
//function adicionarValidacaoSenha() {
   // const form = document.getElementById('form-cadastro');
    //if (form) {
        //form.addEventListener('submit', function(event) {
        //    const senha = document.getElementById('senha').value;
           // const confirmarSenha = document.getElementById('confirmar-senha').value;

            //if (senha !== confirmarSenha) {
              //  event.preventDefault();
              //  alert('As senhas não coincidem! Por favor, verifique.');
          //  }
     //   });
   // }
//}

// Funções para o Modal de Login
///function abrirModalLogin() {
   // const container = document.getElementById('container-modal-login');

   // if (container.innerHTML === "") {
       // fetch('paginas/login-modal.html')
          //  .then(resposta => resposta.text())
           // .then(html => {
              //  container.innerHTML = html;
                
               // setTimeout(() => {
                  //  document.getElementById('modal-login').classList.add('ativo');
                  //  adicionarLogicaLogin();
                //}, 50);
            //})
          //  .catch(erro => console.error('Erro ao carregar o login:', erro));
    //} else {
      //  document.getElementById('modal-login').classList.add('ativo');
    //}
//}

//function fecharModalLogin() {
  //  const modal = document.getElementById('modal-login');
  //  if (modal) modal.classList.remove('ativo');
//}

// Logica de envio do Login
//function adicionarLogicaLogin() {
  //  const form = document.getElementById('form-login');
   // if (form) {
      //  form.addEventListener('submit', function(event) {
         //   event.preventDefault();
            
            // Pega o email (ou primeiro nome dele antes do @) para simular o login
          //  const email = document.getElementById('login-email').value;
           // const nomeSimulado = email.split('@')[0]; 

           // fecharModalLogin();
            
            // Ativa a mesma barra inferior e cabeçalho que fizemos no cadastro!
           // ativarModoLogado(nomeSimulado); 
     //   });
   // }
//}

// FUNÇÃO EXTRA CHIQUE: Mudar de uma janelinha para a outra direto pelo link
//function alternarParaCadastro() {
   // fecharModalLogin();
    //setTimeout(() => {
      //  abrirModal(); // Abre o cadastro
  //  }, 300);
//}

// FUNÇÃO PARA MUDAR DO CADASTRO PARA O LOGIN DIRETO PELO LINK
//function alternarParaLogin() {
    // 1. Fecha o modal de cadastro primeiro
   // fecharModal();
    
    // 2. Espera a animação de fechar terminar (300 milissegundos) e abre o login
   // setTimeout(() => {
     //   abrirModalLogin(); 
  //  }, 300);
//}
// a pessoa entra no modo logado (index-logado.html)
//window.onclick = function(event) {
  //  const modalCadastro = document.getElementById('modal-cadastro');
   // const modalLogin = document.getElementById('modal-login');
    
   // if (event.target === modalCadastro) fecharModal();
    //if (event.target === modalLogin) fecharModalLogin();
//}

//function adicionarLogicaLogin() {
  //  const form = document.getElementById('form-login');
    //if (form) {
       // form.addEventListener('submit', function(event) {
          //  event.preventDefault(); // Evita que a página recarregue antes da hora
            
            // Aqui você pegaria os dados de email e senha futuramente para o banco
           // const email = document.getElementById('login-email').value;
            
            // Fecha a caixinha com o efeito de brilho suavemente
           // fecharModalLogin();
            
            // Alerta opcional de sucesso (pode remover se preferir algo mais direto)
          //  alert('Bem-vindo de volta ao Golden Hall!');
            
            // MÁGICA: Joga o usuário direto para a nova página limpa com a barra inferior dourada
          //  window.location.href = 'index-logado.html';
      //  });
   // }
//}

//function adicionarValidacaoSenha() {
   // const form = document.getElementById('form-cadastro');
    //if (form) {
       // form.addEventListener('submit', function(event) {
          //  event.preventDefault();

         //   const senha = document.getElementById('senha').value;
            //const confirmarSenha = document.getElementById('confirmar-senha').value;

           /// if (senha !== confirmarSenha) {
              //  alert('As senhas não coincidem!');
              //  return;
            //}

           // fecharModal();
         //   alert('Conta criada com sucesso no Golden Hall!');
            
            // MÁGICA: Também joga o novo usuário direto para o index-logado.html
       //     window.location.href = 'index-logado.html';
     //   });
   // }
//}

// botão de sair da conta
// Função que pergunta se o usuário realmente quer deslogar
//function confirmarSaida() {
  //  const certeza = confirm("Tem certeza que deseja sair da sua conta no Golden Hall?");
    
  //  if (certeza) {
        // Se clicar em OK, volta para a página inicial
        //window.location.href = 'index.html';
   // }
    // Se clicar em Cancelar, não faz nada e o usuário continua na página
//}