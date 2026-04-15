import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalvadorData() {
  console.log('🔍 Verificando dados de Salvador no Supabase...\n');
  
  // 1. Verificar se Salvador existe
  console.log('📍 Buscando cidade de Salvador...');
  const { data: salvador, error: salvadorError } = await supabase
    .from('locations')
    .select('*')
    .eq('type', 'city')
    .eq('slug', 'salvador')
    .eq('status', 'active')
    .maybeSingle();
  
  if (salvadorError) {
    console.error('❌ Erro ao buscar Salvador:', salvadorError);
    return;
  }
  
  if (!salvador) {
    console.log('❌ Salvador não encontrada no banco de dados');
    console.log('\n💡 Execute a migration de seed para adicionar Salvador');
    return;
  }
  
  console.log('✅ Salvador encontrada:');
  console.log(`   ID: ${salvador.id}`);
  console.log(`   Nome: ${salvador.name}`);
  console.log(`   Path: ${salvador.geographic_path}`);
  
  // 2. Verificar bairros de Salvador
  console.log('\n📍 Buscando bairros de Salvador...');
  const { data: bairros, error: bairrosError, count } = await supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .eq('type', 'district')
    .eq('parent_id', salvador.id)
    .eq('status', 'active')
    .order('name');
  
  if (bairrosError) {
    console.error('❌ Erro ao buscar bairros:', bairrosError);
    return;
  }
  
  if (!bairros || bairros.length === 0) {
    console.log('❌ Nenhum bairro encontrado para Salvador');
    console.log('\n💡 Execute a migration: 20260330000013_seed_salvador_neighborhoods.sql');
    return;
  }
  
  console.log(`✅ ${count} bairros encontrados:\n`);
  
  // Mostrar primeiros 10 bairros
  bairros.slice(0, 10).forEach((bairro: any) => {
    console.log(`   • ${bairro.name} (${bairro.slug})`);
  });
  
  if (bairros.length > 10) {
    console.log(`   ... e mais ${bairros.length - 10} bairros`);
  }
  
  // 3. Verificar pontos turísticos
  console.log('\n🏛️  Buscando pontos turísticos de Salvador...');
  const { data: pontosTuristicos, error: pontosError } = await supabase
    .from('tourist_points')
    .select('*, location:locations(*)')
    .in('location_id', [salvador.id, ...bairros.map((b: any) => b.id)])
    .order('name');
  
  if (pontosError) {
    console.log('⚠️  Tabela tourist_points não existe ou erro:', pontosError.message);
  } else if (!pontosTuristicos || pontosTuristicos.length === 0) {
    console.log('⚠️  Nenhum ponto turístico encontrado');
    console.log('💡 Execute a migration: 20260331100002_seed_guide_tourist_points_salvador.sql');
  } else {
    console.log(`✅ ${pontosTuristicos.length} pontos turísticos encontrados:\n`);
    pontosTuristicos.forEach((ponto: any) => {
      console.log(`   • ${ponto.name} (${ponto.location?.name || 'sem localização'})`);
    });
  }
  
  // 4. Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO:');
  console.log('='.repeat(60));
  console.log(`✅ Salvador: ${salvador.name}`);
  console.log(`✅ Bairros: ${count} cadastrados`);
  console.log(`${pontosTuristicos && pontosTuristicos.length > 0 ? '✅' : '⚠️ '} Pontos turísticos: ${pontosTuristicos?.length || 0}`);
  console.log('='.repeat(60));
}

checkSalvadorData().catch(console.error);
