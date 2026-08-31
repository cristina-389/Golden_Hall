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
// "tipo" separa clientes (quem reserva espaços) de proprietários (quem
// cadastra espaços) - é isso que depois vai decidir se a pessoa vê a tela
// de cliente ou a tela de proprietário do espaço.
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    telefone TEXT,
    foto TEXT,
    cidade TEXT,
    preferencia_aluguel TEXT,
    bio TEXT,
    token_recuperacao TEXT,
    token_recuperacao_expira TEXT,
    tipo TEXT NOT NULL DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'proprietario')),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// As colunas abaixo foram adicionadas depois que a tabela já existia em
// alguns bancos criados antes delas - "CREATE TABLE IF NOT EXISTS" não
// adiciona colunas novas numa tabela que já existe, então tenta adicionar
// aqui por fora; se a coluna já existir (bancos criados a partir de agora,
// já com ela no CREATE TABLE acima), o SQLite recusa e a gente ignora o erro.
for (const coluna of ['foto TEXT', 'preferencia_aluguel TEXT', 'bio TEXT', 'cidade TEXT', 'token_recuperacao TEXT', 'token_recuperacao_expira TEXT']) {
    try {
        db.exec(`ALTER TABLE usuarios ADD COLUMN ${coluna}`);
    } catch (erro) {
        // "duplicate column name" é o esperado quando a coluna já existe
    }
}

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
    sobre TEXT,
    local TEXT,
    capacidade INTEGER,
    preco REAL,
    imagem TEXT,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dono_id) REFERENCES usuarios (id)
  )
`);

// "sobre" foi adicionada depois que a tabela já existia em bancos criados
// antes dela - mesma ideia da tabela de usuários (ver comentário lá em
// cima): tenta adicionar por fora, e ignora o erro se a coluna já existir.
try {
    db.exec('ALTER TABLE espacos ADD COLUMN sobre TEXT');
} catch (erro) {
    // "duplicate column name" é o esperado quando a coluna já existe
}

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
    horario_termino TEXT,
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

// "horario_termino" foi adicionada depois que a tabela já existia em bancos
// criados antes dela - mesma ideia das outras colunas (ver comentário lá em
// cima, na tabela de usuários): tenta adicionar por fora, e ignora o erro
// se a coluna já existir.
try {
    db.exec('ALTER TABLE reservas ADD COLUMN horario_termino TEXT');
} catch (erro) {
    // "duplicate column name" é o esperado quando a coluna já existe
}

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

// --------------------------------------------------------------------------
// TABELA DE BENEFÍCIOS
// Lista de comodidades de um espaço (ex: "Estacionamento", "Ar
// condicionado"). Uma linha por benefício - um espaço pode ter vários.
// Toda vez que o proprietário salva o espaço, apagamos os benefícios
// antigos dele e inserimos a lista nova (mais simples que ficar
// comparando item por item o que mudou).
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS beneficios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    espaco_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    FOREIGN KEY (espaco_id) REFERENCES espacos (id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE EVENTOS PERMITIDOS
// Lista dos tipos de evento que o proprietário aceita nesse espaço (ex:
// "Casamento", "Formatura"). Mesma ideia da tabela de benefícios - uma
// linha por item, apagada e regravada toda vez que o espaço é salvo.
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS eventos_permitidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    espaco_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    FOREIGN KEY (espaco_id) REFERENCES espacos (id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE PONTOS DE REFERÊNCIA
// Destaques da localização do espaço (ex: "A 5 minutos do centro", "Perto
// da rodovia"). Mesma ideia de novo - uma linha por ponto.
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS pontos_referencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    espaco_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    FOREIGN KEY (espaco_id) REFERENCES espacos (id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE FOTOS
// Fotos extras de um espaço, além da "imagem" principal que já existe na
// tabela espacos (essa continua sendo a capa, usada nos cards). "ordem"
// guarda a posição em que a foto deve aparecer na galeria.
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS fotos_espaco (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    espaco_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (espaco_id) REFERENCES espacos (id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE AVALIAÇÕES
// Só quem teve uma reserva "Aprovada" pode avaliar - por isso a avaliação
// é ligada a uma reserva específica (reserva_id), não só ao espaço. O
// "UNIQUE(reserva_id)" garante que cada reserva só gera UMA avaliação
// (não dá pra avaliar a mesma experiência várias vezes).
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS avaliacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    espaco_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    reserva_id INTEGER NOT NULL,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (espaco_id) REFERENCES espacos (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (reserva_id) REFERENCES reservas (id),
    UNIQUE (reserva_id)
  )
`);

// --------------------------------------------------------------------------
// TABELA DE VISUALIZAÇÕES
// Uma linha toda vez que um cliente logado abre a página de detalhes de um
// espaço - alimenta a estatística "Visualizados" da home do cliente
// (index-logado.html). Não tem UNIQUE: visualizar o mesmo espaço várias
// vezes conta várias vezes, já que é uma métrica de atividade/consumo, não
// de "espaços diferentes vistos".
// --------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS visualizacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    espaco_id INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (espaco_id) REFERENCES espacos (id)
  )
`);

// Exporta a conexão já pronta (com as tabelas garantidas) pra quem
// precisar consultar ou gravar dados no banco
module.exports = db;
