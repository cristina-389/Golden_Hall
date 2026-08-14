/* ==========================================================================
   GOLDEN HALL - SCRIPT DE "SEED" (POPULAR O BANCO COM DADOS DE EXEMPLO)
   "Seed" (semente, em inglês) é o nome comum pra um script que planta dados
   iniciais num banco vazio. Roda uma vez (npm run seed) pra criar uma conta
   de dono de exemplo e os 6 espaços que antes eram páginas HTML fixas.

   É seguro rodar esse script mais de uma vez: ele confere se o e-mail do
   dono e os slugs dos espaços já existem antes de inserir, então não cria
   duplicatas mesmo se você rodar sem querer de novo.
   ========================================================================== */

const bcrypt = require('bcryptjs');
const db = require('./db');

const EMAIL_DONO_EXEMPLO = 'contato@goldenhall.com';
const SENHA_DONO_EXEMPLO = 'golden123';

// Garante que existe uma conta "dono" pra ser dona dos espaços de exemplo
// (todo espaço PRECISA de um dono_id - ver database/db.js). Se a conta já
// existir de uma vez anterior, só reaproveita o id dela.
function garantirDonoExemplo() {
    let dono = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(EMAIL_DONO_EXEMPLO);

    if (!dono) {
        const senhaCriptografada = bcrypt.hashSync(SENHA_DONO_EXEMPLO, 10);
        const resultado = db
            .prepare('INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)')
            .run('Golden Hall', EMAIL_DONO_EXEMPLO, senhaCriptografada, 'dono');

        dono = { id: Number(resultado.lastInsertRowid) };
        console.log(`Conta de dono de exemplo criada: ${EMAIL_DONO_EXEMPLO} (senha: ${SENHA_DONO_EXEMPLO})`);
    }

    return dono.id;
}

const espacosExemplo = [
    {
        slug: 'chacara-golden',
        nome: 'Chácara Golden',
        descricao: 'Um espaço cercado pela natureza, perfeito para quem busca tranquilidade, conforto e momentos inesquecíveis em eventos ao ar livre.',
        local: 'Caieiras - SP',
        capacidade: 150,
        preco: 1800,
        imagem: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1200&auto=format&fit=crop'
    },
    {
        slug: 'salao-golden-luxo',
        nome: 'Salão Golden Luxo',
        descricao: 'O Salão Golden Luxo é um ambiente sofisticado e moderno, ideal para eventos que exigem elegância, conforto e uma estrutura completa.',
        local: 'Caieiras - SP',
        capacidade: 300,
        preco: 2500,
        imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop'
    },
    {
        slug: 'eventos-royal',
        nome: 'Eventos Royal',
        descricao: 'Um ambiente moderno e sofisticado para formaturas, jantares e eventos sociais.',
        local: 'Caieiras - SP',
        capacidade: 250,
        preco: 2200,
        imagem: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop'
    },
    {
        slug: 'espaco-premium',
        nome: 'Espaço Premium',
        descricao: 'Estrutura completa para congressos, palestras, feiras e grandes eventos empresariais.',
        local: 'Caieiras - SP',
        capacidade: 500,
        preco: 4000,
        imagem: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop'
    },
    {
        slug: 'villa-imperial',
        nome: 'Villa Imperial',
        descricao: 'Um espaço luxuoso para grandes celebrações e eventos exclusivos, com estrutura completa e acabamento refinado.',
        local: 'Caieiras - SP',
        capacidade: 400,
        preco: 3500,
        imagem: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop'
    },
    {
        slug: 'jardim-das-flores',
        nome: 'Jardim das Flores',
        descricao: 'Um ambiente ao ar livre cercado por jardins, perfeito para cerimônias românticas e eventos intimistas.',
        local: 'Caieiras - SP',
        capacidade: 180,
        preco: 1950,
        imagem: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop'
    }
];

function semear() {
    const donoId = garantirDonoExemplo();
    let criados = 0;

    for (const espaco of espacosExemplo) {
        const jaExiste = db.prepare('SELECT id FROM espacos WHERE slug = ?').get(espaco.slug);
        if (jaExiste) continue; // já foi semeado antes - não duplica

        db.prepare(`
            INSERT INTO espacos (dono_id, slug, nome, descricao, local, capacidade, preco, imagem)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(donoId, espaco.slug, espaco.nome, espaco.descricao, espaco.local, espaco.capacidade, espaco.preco, espaco.imagem);

        criados++;
    }

    console.log(`Seed concluído: ${criados} espaço(s) novo(s) criado(s) (de ${espacosExemplo.length} no total).`);
}

semear();
