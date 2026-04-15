/**
 * Script para popular o banco REMOTO com classificados completos - PARTE 2
 * 
 * Execute com: npx tsx scripts/seed-classifieds-remote-part2.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.remote
dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

console.log('✅ Conectando ao Supabase REMOTO:', supabaseUrl);
console.log('🔐 Usando service_role_key para bypass RLS\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedClassifiedsPart2() {
  console.log('🌱 Iniciando seed de classificados - PARTE 2...\n');

  // 1. Buscar localidades
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, type, slug')
    .or('name.eq.Salvador,type.eq.district')
    .limit(20);

  if (locError || !locations || locations.length === 0) {
    console.error('❌ Erro ao buscar localidades');
    return;
  }

  const locationMap = new Map(locations.map(loc => [loc.name, loc.id]));

  // 2. Buscar vendedor
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, name')
    .limit(1);

  const sellerId = existingProfiles?.[0]?.id;
  if (!sellerId) {
    console.error('❌ Nenhum perfil encontrado');
    return;
  }

  console.log(`✅ Usando vendedor: ${existingProfiles[0].name}\n`);

  // 3. Classificados restantes
  const classifieds = [
    {
      title: 'Apartamento 2 Quartos Mobiliado - Aluguel',
      description: 'Apartamento 2 quartos mobiliado, sala ampla, cozinha planejada, banheiro social e área de serviço. Prédio com elevador, portaria 24h, salão de festas e playground. Localização privilegiada, próximo ao Shopping Paralela e com fácil acesso ao transporte público. Condomínio R$ 450.',
      price: 1800,
      category: 'imóveis',
      condition: 'novo',
      photos: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Imbuí',
    },
    {
      title: 'Tênis Nike Air Max 90 Original - Tam 42',
      description: 'Tênis Nike Air Max 90 original importado, tamanho 42, cor branca com detalhes em preto. Usado poucas vezes, em ótimo estado de conservação. Palmilha original, sem desgastes. Acompanha caixa original e nota fiscal da loja autorizada Nike.',
      price: 450,
      category: 'roupas',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Costa Azul',
    },
    {
      title: 'Máquina de Lavar Brastemp 12kg - Nova na Caixa',
      description: 'Máquina de lavar Brastemp 12kg, totalmente nova e lacrada na caixa original. Comprei duplicada por engano e não posso devolver. Modelo com 12 programas de lavagem, função turbo, painel digital e tecnologia de economia de água e energia. Acompanha nota fiscal e garantia de fábrica completa de 1 ano.',
      price: 2200,
      category: 'outros',
      condition: 'novo',
      photos: [
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Piatã',
    },
    {
      title: 'Violão Yamaha C40 - Novo, com Capa e Afinador',
      description: 'Violão clássico Yamaha C40, totalmente novo, nunca foi tocado. Modelo ideal para iniciantes e estudantes. Tampo em spruce, laterais e fundo em meranti. Som equilibrado e ótima projeção. Acompanha capa acolchoada de proteção, afinador digital cromático e jogo de cordas extra.',
      price: 650,
      category: 'outros',
      condition: 'novo',
      photos: [
        'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Rio Vermelho',
    },
    {
      title: 'Guarda-Roupa 6 Portas com Espelho - Branco',
      description: 'Guarda-roupa 6 portas em MDF de alta qualidade, cor branca, com espelho central bisotado. Parte interna com prateleiras e cabideiros. Bem conservado, apenas 2 anos de uso. Medidas: 2,70m largura x 2,20m altura x 0,55m profundidade. Desmonto para facilitar o transporte.',
      price: 900,
      category: 'móveis',
      condition: 'usado',
      photos: [
        'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Cabula',
    },
    {
      title: 'Nintendo Switch OLED + 3 Jogos',
      description: 'Nintendo Switch OLED modelo branco, em perfeito estado de conservação. Tela OLED de 7 polegadas com cores vibrantes. Acompanha 3 jogos físicos originais: The Legend of Zelda Tears of the Kingdom, Mario Kart 8 Deluxe e Animal Crossing New Horizons. Inclui case de proteção rígido, película de vidro já instalada, dock, controles Joy-Con e todos os cabos originais.',
      price: 2200,
      category: 'games',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585857188823-f1dbcf6c8b5f?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Pituba',
    },
  ];

  // 4. Inserir classificados
  console.log('📦 Inserindo classificados - PARTE 2...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const classified of classifieds) {
    const locationId = locationMap.get(classified.neighborhood) || locations[0].id;

    const { data, error } = await supabase
      .from('classifieds')
      .insert({
        title: classified.title,
        description: classified.description,
        price: classified.price,
        category: classified.category,
        condition: classified.condition,
        photos: classified.photos,
        location_id: locationId,
        seller_id: sellerId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Erro ao inserir "${classified.title}":`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Inserido: ${classified.title}`);
      console.log(`   📍 Bairro: ${classified.neighborhood}`);
      console.log(`   💰 Preço: R$ ${classified.price.toLocaleString('pt-BR')}`);
      console.log(`   🆔 ID: ${data.id}\n`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Seed PARTE 2 concluído!');
  console.log(`✅ Sucesso: ${successCount} classificados`);
  console.log(`❌ Erros: ${errorCount} classificados`);
  console.log('='.repeat(60));
}

seedClassifiedsPart2().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
