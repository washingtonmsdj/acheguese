/**
 * Script para popular o banco REMOTO com classificados completos
 * 
 * Execute com: npx tsx scripts/seed-classifieds-remote.ts
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
  console.log('💡 Certifique-se de ter um arquivo .env.remote com:');
  console.log('   VITE_SUPABASE_URL=...');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

console.log('✅ Conectando ao Supabase REMOTO:', supabaseUrl);
console.log('🔐 Usando service_role_key para bypass RLS\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedClassifieds() {
  console.log('🌱 Iniciando seed de classificados no banco REMOTO...\n');

  // 1. Buscar localidades existentes (Salvador e bairros)
  console.log('📍 Buscando localidades de Salvador...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, type, slug')
    .or('name.eq.Salvador,type.eq.district')
    .limit(20);

  if (locError) {
    console.error('❌ Erro ao buscar localidades:', locError);
    return;
  }

  if (!locations || locations.length === 0) {
    console.log('⚠️  Nenhuma localidade encontrada no banco.');
    console.log('💡 Execute primeiro o script de seed de locations');
    return;
  }

  console.log(`✅ Encontradas ${locations.length} localidades`);

  // Mapear bairros por nome para facilitar
  const locationMap = new Map(locations.map(loc => [loc.name, loc.id]));

  // 2. Buscar ou criar usuários vendedores
  console.log('\n👤 Verificando usuários vendedores...');
  
  const sellers = [
    { id: 'user-001', name: 'Carlos Silva', phone: '71987654321' },
    { id: 'user-002', name: 'Maria Santos', phone: '71998765432' },
    { id: 'user-003', name: 'João Oliveira', phone: '71987651234' },
    { id: 'user-005', name: 'Pedro Henrique', phone: '71987123456' },
    { id: 'user-007', name: 'Ricardo Alves', phone: '71987456789' },
    { id: 'user-008', name: 'Juliana Martins', phone: '71998123456' },
    { id: 'user-010', name: 'Beatriz Lima', phone: '71987789456' },
    { id: 'user-011', name: 'Imobiliária Bahia', phone: '7133334444' },
  ];

  // Buscar perfis existentes
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('id, name')
    .limit(10);

  let sellerId = existingProfiles && existingProfiles.length > 0 
    ? existingProfiles[0].id 
    : null;

  if (!sellerId) {
    console.error('❌ Nenhum perfil encontrado. Crie um usuário primeiro.');
    return;
  }

  console.log(`✅ Usando vendedor: ${existingProfiles[0].name} (${sellerId})`);

  // 3. Dados dos classificados (baseados nos mocks atualizados)
  const classifieds = [
    {
      title: 'iPhone 14 Pro Max 256GB - Seminovo',
      description: 'iPhone 14 Pro Max 256GB na cor Deep Purple. Aparelho em perfeito estado, sem arranhões, com caixa original, carregador e nota fiscal. Bateria com 98% de saúde. Acompanha capinha de silicone original Apple e película de vidro já instalada.',
      price: 4500,
      category: 'eletrônicos',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop&sat=-100',
        'https://images.unsplash.com/photo-1592286927505-2fd0f2adb7c4?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Pituba',
    },
    {
      title: 'Sofá 3 Lugares Retrátil e Reclinável - Cinza',
      description: 'Sofá 3 lugares retrátil e reclinável, cor cinza, tecido suede de alta qualidade. Muito confortável, apenas 1 ano de uso. Medidas: 2,20m x 1,05m x 0,90m. Estrutura em madeira maciça, pés em aço inox. Aceito cartão e faço entrega na região metropolitana.',
      price: 1200,
      category: 'móveis',
      condition: 'usado',
      photos: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Barra',
    },
    {
      title: 'Honda Civic 2020 EXL - Automático, Único Dono',
      description: 'Honda Civic EXL 2.0 automático, ano 2020, cor prata. Único dono, revisões em concessionária, IPVA 2026 pago. 45.000 km rodados. Carro impecável, sem detalhes. Aceito troca por carro de menor valor + volta.',
      price: 98000,
      category: 'veículos',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Itaigara',
    },
    {
      title: 'Notebook Dell Inspiron 15 - i7, 16GB RAM, SSD 512GB',
      description: 'Notebook Dell Inspiron 15, Intel Core i7 11ª geração, 16GB RAM DDR4, SSD 512GB NVMe, placa de vídeo MX450 2GB. Tela Full HD 15.6", teclado retroiluminado. Perfeito para trabalho, estudos e jogos leves. Acompanha carregador original e mouse sem fio.',
      price: 3200,
      category: 'eletrônicos',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Rio Vermelho',
    },
    {
      title: 'PlayStation 5 + 2 Controles + 5 Jogos Originais',
      description: 'PlayStation 5 com leitor de disco, em perfeito estado de conservação. Acompanha 2 controles DualSense (branco e preto) e 5 jogos originais: God of War Ragnarök, Spider-Man Miles Morales, FIFA 24, Gran Turismo 7 e Horizon Forbidden West. Todos os cabos originais e caixa inclusos.',
      price: 3800,
      category: 'games',
      condition: 'usado',
      photos: [
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Caminho das Árvores',
    },
    {
      title: 'Mesa de Jantar 6 Lugares + 6 Cadeiras - Madeira Maciça',
      description: 'Mesa de jantar em madeira maciça de demolição com tampo de vidro temperado 8mm e 6 cadeiras estofadas em tecido bege. Estilo clássico e elegante, perfeita para sala de jantar. Medidas da mesa: 1,80m x 0,90m. Muito bem conservada, apenas 2 anos de uso.',
      price: 1800,
      category: 'móveis',
      condition: 'usado',
      photos: [
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Graça',
    },
    {
      title: 'Bicicleta Mountain Bike Aro 29 - Shimano 21v',
      description: 'Mountain bike aro 29, quadro em alumínio tamanho 17, 21 marchas Shimano Tourney, freios a disco mecânicos. Suspensão dianteira com trava. Pouco usada, apenas 6 meses. Acompanha capacete, bomba de ar e kit de ferramentas básicas.',
      price: 1500,
      category: 'outros',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Ondina',
    },
    {
      title: 'Vestido de Festa Longo Azul Royal - Tam 38',
      description: 'Vestido de festa longo na cor azul royal, tamanho 38. Modelo sereia com cauda, decote em V, tecido de alta qualidade com brilho discreto. Usado apenas uma vez em casamento. Perfeito estado, sem manchas ou defeitos. Ideal para festas e eventos formais.',
      price: 350,
      category: 'roupas',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Vitória',
    },
    {
      title: 'Smart TV Samsung 55" 4K UHD - 6 Meses de Uso',
      description: 'Smart TV Samsung 55 polegadas, resolução 4K UHD, HDR10+, sistema operacional Tizen com todos os apps (Netflix, Prime, Disney+). Apenas 6 meses de uso, em perfeito estado. Acompanha controle original, manual e nota fiscal. Garantia de fábrica válida até dezembro/2026.',
      price: 2400,
      category: 'eletrônicos',
      condition: 'seminovo',
      photos: [
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Brotas',
    },
    {
      title: 'Geladeira Brastemp Frost Free 400L Inox',
      description: 'Geladeira Brastemp duplex frost free, capacidade 400 litros, acabamento em inox. Funcionamento perfeito, muito econômica (selo A de eficiência energética). 3 anos de uso, bem conservada. Faço entrega na região metropolitana de Salvador por valor adicional.',
      price: 1600,
      category: 'outros',
      condition: 'usado',
      photos: [
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&h=600&fit=crop',
      ],
      neighborhood: 'Paralela',
    },
  ];

  // 4. Inserir classificados
  console.log('\n📦 Inserindo classificados no banco remoto...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const classified of classifieds) {
    // Buscar location_id pelo nome do bairro
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
  console.log('🎉 Seed concluído!');
  console.log(`✅ Sucesso: ${successCount} classificados`);
  console.log(`❌ Erros: ${errorCount} classificados`);
  console.log('='.repeat(60));
}

// Executar
seedClassifieds().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
