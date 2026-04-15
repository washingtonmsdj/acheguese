/**
 * Script para popular o banco com classificados de teste
 * 
 * Execute com: npx tsx scripts/seed-classifieds.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Usar service_role_key para bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('💡 Certifique-se de ter um arquivo .env.local com:');
  console.log('   VITE_SUPABASE_URL=...');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=...');
  process.exit(1);
}

console.log('✅ Conectando ao Supabase:', supabaseUrl);
console.log('🔐 Usando service_role_key para bypass RLS');

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedClassifieds() {
  console.log('🌱 Iniciando seed de classificados...\n');

  // 1. Buscar localidades existentes
  console.log('📍 Buscando localidades...');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, type')
    .limit(10);

  console.log('Debug locations:', { locations, error: locError });

  if (locError) {
    console.error('❌ Erro ao buscar localidades:', locError);
    console.log('💡 Verifique as permissões RLS da tabela locations');
    return;
  }

  if (!locations || locations.length === 0) {
    console.log('⚠️  Nenhuma localidade encontrada no banco.');
    console.log('💡 Execute uma query manual para verificar:');
    console.log('   SELECT id, name, type FROM locations LIMIT 5;');
    return;
  }

  console.log(`✅ Encontradas ${locations.length} localidades:`);
  locations.forEach(loc => console.log(`   - ${loc.name} (${loc.type}) - ${loc.id}`));

  // 2. Buscar usuário vendedor
  console.log('\n👤 Buscando usuário vendedor...');
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, name')
    .limit(1);

  if (profError || !profiles || profiles.length === 0) {
    console.error('❌ Erro ao buscar perfis:', profError);
    console.log('💡 Crie um usuário primeiro.');
    return;
  }

  const sellerId = profiles[0].id;
  console.log(`✅ Vendedor: ${profiles[0].name} (${sellerId})`);


  // 3. Dados dos classificados
  const classifieds = [
    {
      title: 'iPhone 14 Pro Max 256GB - Seminovo',
      description: 'iPhone 14 Pro Max 256GB na cor Deep Purple. Aparelho em perfeito estado, sem arranhões, com caixa original, carregador e nota fiscal. Bateria com 98% de saúde. Aceito propostas.',
      price: 4500,
      category: 'eletrônicos',
      condition: 'usado',
      photos: [
        'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop&sat=-100'
      ],
      location_id: locations[0].id,
    },
    {
      title: 'Sofá 3 Lugares Retrátil e Reclinável',
      description: 'Sofá 3 lugares retrátil e reclinável, cor cinza, tecido suede. Muito confortável e em ótimo estado de conservação. Apenas 1 ano de uso. Medidas: 2,20m x 1,05m.',
      price: 1200,
      category: 'móveis',
      condition: 'usado',
      photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
      location_id: locations[1 % locations.length].id,
    },
    {
      title: 'Notebook Dell Inspiron 15 - i7 16GB',
      description: 'Notebook Dell Inspiron 15 com processador Intel Core i7 11ª geração, 16GB RAM, SSD 512GB, placa de vídeo dedicada MX450. Perfeito para trabalho e jogos leves.',
      price: 3200,
      category: 'eletrônicos',
      condition: 'usado',
      photos: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=600&fit=crop'],
      location_id: locations[2 % locations.length].id,
    },
  ];


  // 4. Inserir classificados
  console.log('\n📦 Inserindo classificados...');
  
  for (const classified of classifieds) {
    const { data, error } = await supabase
      .from('classifieds')
      .insert({
        ...classified,
        seller_id: sellerId,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Erro ao inserir "${classified.title}":`, error.message);
    } else {
      console.log(`✅ Inserido: ${classified.title} (${data.id})`);
    }
  }

  console.log('\n🎉 Seed concluído!');
}

// Executar
seedClassifieds().catch(console.error);
