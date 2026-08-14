/* ==========================================================================
   GOLDEN HALL - CONEXÃO COM O BANCO DE DADOS (SQLite)
   Esse arquivo faz duas coisas:
   1) Abre (ou cria, se ainda não existir) o arquivo golden_hall.db, que é
      o banco de dados inteiro guardado como um único arquivo nessa pasta.
   2) Garante que as tabelas existam, criando-as se for a primeira vez que
      o servidor roda ("CREATE TABLE IF NOT EXISTS" não faz nada se a
      tabela já existir, então é seguro rodar isso toda vez que o servidor liga).

   Outros arquivos do projeto vão pedir esse arquivo com "require('./database/db')"
   pra poder consultar/gravar dados, sem precisar abrir a conexão de novo.
   ========================================================================== */

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

// __dirname é a pasta onde este arquivo (db.js) está. Assim o caminho do
// banco sempre funciona, não importa de onde o servidor for iniciado.
const caminhoDoBanco = path.join(__dirname, 'golden_hall.db');

const db = new DatabaseSync(caminhoDoBanco);

// Ativa a checagem de "chaves estrangeiras" (foreign keys) - é o que garante,
// por exemplo, que uma reserva não possa apontar pra um espaco_id que não
// existe na tabela de espaços. Por padrão o SQLite vem com isso desligado.
db.exec('PRAGMA foreign_keys = ON');

// --------------------------------------------------------------------------
// TABELA DE USUÁRIOS
// "tipo" separa clientes (quem reserva espaços) de donos (quem cadastra
// espaços) - é isso que depois vai decidir se a pessoa vê a tela de cliente
// ou a tela de dono do espaço.
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    telefone TEXT,
    tipo TEXT NOT NULL DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'dono')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// --------------------------------------------------------------------------
// TABELA DE ESPAÇOS
// "dono_id" é uma chave estrangeira (FOREIGN KEY): guarda o id de QUEM na
// tabela usuarios é o dono deste espaço. "slug" é o identificador amigável
// que já usamos no front-end (ex: "chacara-golden").
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS espacos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dono_id INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    descricao TEXT,
    local TEXT,
    capacidade INTEGER,
    preco REAL,
    imagem TEXT,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dono_id) REFERENCES usuarios (id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE RESERVAS
// Os campos aqui são basicamente os mesmos que já existiam no objeto salvo
// no localStorage (reservas.js), só que agora "espaco_id" e "usuario_id"
// apontam pra linhas de verdade nas outras tabelas, em vez de texto solto.
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    espaco_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    horario TEXT,
    tipo_evento TEXT,
    convidados INTEGER,
    telefone TEXT,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Cancelado')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (espaco_id) REFERENCES espacos (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE FAVORITOS
// O "UNIQUE(usuario_id, espaco_id)" no final impede que a MESMA pessoa
// favorite o MESMO espaço duas vezes (o banco recusa a segunda tentativa).
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS favoritos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    espaco_id INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (espaco_id) REFERENCES espacos (id),
    UNIQUE (usuario_id, espaco_id)
  )
`);

// Exporta a conexão já pronta (com as tabelas garantidas) pra quem
// precisar consultar ou gravar dados no banco
module.exports = db;
