/* ==========================================================================
   GOLDEN HALL - SCRIPT DE "SEED" (POPULAR O BANCO COM DADOS DE EXEMPLO)
   "Seed" (semente, em inglês) é o nome comum pra um script que planta dados
   iniciais num banco vazio. Roda uma vez (npm run seed) pra criar uma conta
   de proprietário de exemplo e os 6 espaços que antes eram páginas HTML fixas.

   É seguro rodar esse script mais de uma vez: ele confere se o e-mail do
   proprietário e os slugs dos espaços já existem antes de inserir, então não
   cria duplicatas mesmo se você rodar sem querer de novo.
   ========================================================================== */

const bcrypt = require('bcryptjs');
const db = require('./db');

const EMAIL_PROPRIETARIO_EXEMPLO = 'contato@goldenhall.com';
const SENHA_PROPRIETARIO_EXEMPLO = 'golden123';

// Garante que existe uma conta "proprietario" pra ser dona dos espaços de
// exemplo (todo espaço PRECISA de um dono_id - ver database/db.js). Se a
// conta já existir de uma vez anterior, só reaproveita o id dela.
function garantirProprietarioExemplo() {
    let proprietario = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(EMAIL_PROPRIETARIO_EXEMPLO);

    if (!proprietario) {
        const senhaCriptografada = bcrypt.hashSync(SENHA_PROPRIETARIO_EXEMPLO, 10);
        const resultado = db
            .prepare('INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)')
            .run('Golden Hall', EMAIL_PROPRIETARIO_EXEMPLO, senhaCriptografada, 'proprietario');

        proprietario = { id: Number(resultado.lastInsertRowid) };
        console.log(`Conta de proprietário de exemplo criada: ${EMAIL_PROPRIETARIO_EXEMPLO} (senha: ${SENHA_PROPRIETARIO_EXEMPLO})`);
    }

    return proprietario.id;
}

const espacosExemplo = [
    {
        slug: 'chacara-golden',
        nome: 'Chácara Golden',
        descricao: 'Um espaço cercado pela natureza, perfeito para quem busca tranquilidade, conforto e momentos inesquecíveis em eventos ao ar livre.',
        local: 'Caieiras - SP',
        capacidade: 150,
        preco: 1800,
        imagem: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop',
        beneficios: ['Estacionamento', 'Área verde', 'Churrasqueira', 'Piscina'],
        eventos_permitidos: ['Casamento', 'Aniversário', 'Confraternização'],
        pontos_referencia: ['A 10 minutos do centro de Caieiras', 'Fácil acesso pela Rodovia dos Bandeirantes']
    },
    {
        slug: 'salao-golden-luxo',
        nome: 'Salão Golden Luxo',
        descricao: 'O Salão Golden Luxo é um ambiente sofisticado e moderno, ideal para eventos que exigem elegância, conforto e uma estrutura completa.',
        local: 'Caieiras - SP',
        capacidade: 300,
        preco: 2500,
        imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
        beneficios: ['Ar condicionado', 'Sistema de som', 'Cozinha equipada', 'Vagas de estacionamento'],
        eventos_permitidos: ['Casamento', 'Formatura', 'Evento corporativo'],
        pontos_referencia: ['Próximo a hotéis', 'A 5 minutos da rodovia']
    },
    {
        slug: 'eventos-royal',
        nome: 'Eventos Royal',
        descricao: 'Um ambiente moderno e sofisticado para formaturas, jantares e eventos sociais.',
        local: 'Caieiras - SP',
        capacidade: 250,
        preco: 2200,
        imagem: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop',
        beneficios: ['Ar condicionado', 'Iluminação decorativa', 'Palco'],
        eventos_permitidos: ['Formatura', 'Jantar de gala', 'Evento social'],
        pontos_referencia: ['No centro de Caieiras', 'Estacionamento na rua']
    },
    {
        slug: 'espaco-premium',
        nome: 'Espaço Premium',
        descricao: 'Estrutura completa para congressos, palestras, feiras e grandes eventos empresariais.',
        local: 'Caieiras - SP',
        capacidade: 500,
        preco: 4000,
        imagem: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
        beneficios: ['Wi-Fi', 'Projetor e telão', 'Ar condicionado', 'Estacionamento amplo'],
        eventos_permitidos: ['Congresso', 'Palestra', 'Feira', 'Evento corporativo'],
        pontos_referencia: ['Fácil acesso pela rodovia', 'Próximo a hotéis e restaurantes']
    },
    {
        slug: 'villa-imperial',
        nome: 'Villa Imperial',
        descricao: 'Um espaço luxuoso para grandes celebrações e eventos exclusivos, com estrutura completa e acabamento refinado.',
        local: 'Caieiras - SP',
        capacidade: 400,
        preco: 3500,
        imagem: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop',
        beneficios: ['Jardim privativo', 'Salão climatizado', 'Espaço para banda'],
        eventos_permitidos: ['Casamento', 'Debutante', 'Evento exclusivo'],
        pontos_referencia: ['Em área nobre de Caieiras', 'A 10 minutos do centro']
    },
    {
        slug: 'jardim-das-flores',
        nome: 'Jardim das Flores',
        descricao: 'Um ambiente ao ar livre cercado por jardins, perfeito para cerimônias românticas e eventos intimistas.',
        local: 'Caieiras - SP',
        capacidade: 180,
        preco: 1950,
        imagem: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop',
        beneficios: ['Área verde', 'Espaço coberto e descoberto', 'Estacionamento'],
        eventos_permitidos: ['Casamento', 'Noivado', 'Chá revelação'],
        pontos_referencia: ['Cercado por natureza', 'A 15 minutos do centro']
    }
];

function semear() {
    const donoId = garantirProprietarioExemplo();
    let criados = 0;

    for (const espaco of espacosExemplo) {
        const jaExiste = db.prepare('SELECT id FROM espacos WHERE slug = ?').get(espaco.slug);
        if (jaExiste) continue; // já foi semeado antes - não duplica

        const resultado = db.prepare(`
            INSERT INTO espacos (dono_id, slug, nome, descricao, local, capacidade, preco, imagem)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(donoId, espaco.slug, espaco.nome, espaco.descricao, espaco.local, espaco.capacidade, espaco.preco, espaco.imagem);

        const espacoId = Number(resultado.lastInsertRowid);

        const inserirBeneficio = db.prepare('INSERT INTO beneficios (espaco_id, texto) VALUES (?, ?)');
        espaco.beneficios.forEach(texto => inserirBeneficio.run(espacoId, texto));

        const inserirEvento = db.prepare('INSERT INTO eventos_permitidos (espaco_id, texto) VALUES (?, ?)');
        espaco.eventos_permitidos.forEach(texto => inserirEvento.run(espacoId, texto));

        const inserirPonto = db.prepare('INSERT INTO pontos_referencia (espaco_id, texto) VALUES (?, ?)');
        espaco.pontos_referencia.forEach(texto => inserirPonto.run(espacoId, texto));

        criados++;
    }

    console.log(`Seed concluído: ${criados} espaço(s) novo(s) criado(s) (de ${espacosExemplo.length} no total).`);
}

semear();
