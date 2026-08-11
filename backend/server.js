/* ==========================================================================
   GOLDEN HALL - SERVIDOR (PONTO DE ENTRADA DO BACK-END)
   Esse é o arquivo que você roda pra ligar o back-end ("npm start" ou
   "npm run dev"). Ele cria o servidor Express, liga o banco de dados
   (só de importar ./database/db, as tabelas já são criadas se não existirem)
   e depois vai ganhando rotas conforme o projeto cresce.
   ========================================================================== */

// Carrega o arquivo .env e coloca cada linha dele em process.env - precisa
// ser a PRIMEIRA coisa a rodar, antes de qualquer código que use uma
// variável de ambiente (como o JWT_SECRET em routes/usuarios.js)
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Só de dar require aqui, o código de database/db.js já roda e garante que
// o arquivo golden_hall.db e as tabelas existem
require('./database/db');

const app = express();
const PORTA = process.env.PORTA || 3000;

// --------------------------------------------------------------------------
// MIDDLEWARES (funções que rodam em TODA requisição, antes de chegar nas rotas)
// --------------------------------------------------------------------------

// Libera o front-end (que roda em outro endereço/porta) a fazer pedidos pra
// essa API, sem o navegador bloquear por segurança (política de CORS)
app.use(cors());

// Sem isso, quando o front-end mandar dados em JSON (ex: o formulário de
// cadastro), o Express não saberia ler - com isso, tudo que chegar em JSON
// vira automaticamente um objeto JavaScript em "req.body"
app.use(express.json());

// --------------------------------------------------------------------------
// ROTA DE TESTE
// Serve só pra confirmar que o servidor está de pé. Acesse no navegador
// (ou com curl) em http://localhost:3000/api/status
// --------------------------------------------------------------------------
app.get('/api/status', (req, res) => {
    res.json({ ok: true, mensagem: 'Golden Hall API rodando!' });
});

// --------------------------------------------------------------------------
// ROTAS DE USUÁRIOS (cadastro e login)
// Tudo que está dentro de routes/usuarios.js passa a viver sob o prefixo
// "/api" - ou seja, a rota "/cadastro" de lá vira "/api/cadastro" aqui fora
// --------------------------------------------------------------------------
app.use('/api', require('./routes/usuarios'));

// --------------------------------------------------------------------------
// ROTAS DE ESPAÇOS (CRUD: listar, ver detalhes, criar, editar, remover)
// --------------------------------------------------------------------------
app.use('/api', require('./routes/espacos'));

// --------------------------------------------------------------------------
// ROTAS DE RESERVAS (criar, listar as minhas, cancelar, ver datas ocupadas)
// --------------------------------------------------------------------------
app.use('/api', require('./routes/reservas'));

// --------------------------------------------------------------------------
// LIGA O SERVIDOR
// --------------------------------------------------------------------------
app.listen(PORTA, () => {
    console.log(`Golden Hall API rodando em http://localhost:${PORTA}`);
});
