/**
 * Reverte locations chutadas e marca registros como inválidos
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const FAKE_LOCATION_ID = '384add59-4e53-489d-a7b5-97dea2b3f442'; // Pituba

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  REVERSÃO DE LOCATIONS CHUTADAS');
  console.log('═══════════════════════════════════════════════════\n');
  
  // 1. Identificar registros afetados
  console.log('🔍 Identificando registros com Pituba chutada...\n');
  
  const { data: businesses } = await supabase
    .from('business_data')
    .select('id, profile_id, business_name, metadata, address_id')
    .eq('location_id', FAKE_LOCATION_ID);
  
  const { data: professionals } = await supabase
    .from('professional_data')
    .select('id, profile_id, professional_name, metadata, address_id')
    .eq('location_id', FAKE_LOCATION_ID);
  
  console.log(`📊 Encontrados:`);
  console.log(`   business_data: ${businesses?.length || 0} registros`);
  console.log(`   professional_data: ${professionals?.length || 0} registros\n`);
  
  // 2. Verificar quais são realmente vazios (sem address_id, sem metadata útil)
  const emptyBusinesses = businesses?.filter(b => 
    !b.address_id && 
    (!b.metadata || Object.keys(b.metadata).length === 0)
  ) || [];
  
  const emptyProfessionals = professionals?.filter(p => 
    !p.address_id && 
    (!p.metadata || Object.keys(p.metadata).length === 0)
  ) || [];
  
  console.log(`📊 Registros realmente vazios (sem dados de localização):`);
  console.log(`   business_data: ${emptyBusinesses.length}`);
  console.log(`   professional_data: ${emptyProfessionals.length}\n`);
  
  // 3. Listar IDs afetados
  if (emptyBusinesses.length > 0) {
    console.log('IDs de business_data vazios:');
    emptyBusinesses.slice(0, 5).forEach(b => {
      console.log(`  - ${b.id} (${b.business_name || 'sem nome'})`);
    });
    if (emptyBusinesses.length > 5) {
      console.log(`  ... e mais ${emptyBusinesses.length - 5} registros\n`);
    }
  }
  
  if (emptyProfessionals.length > 0) {
    console.log('IDs de professional_data vazios:');
    emptyProfessionals.slice(0, 5).forEach(p => {
      console.log(`  - ${p.id} (${p.professional_name || 'sem nome'})`);
    });
    if (emptyProfessionals.length > 5) {
      console.log(`  ... e mais ${emptyProfessionals.length - 5} registros\n`);
    }
  }
  
  // 4. DECISÃO: Deletar registros vazios (são dados de teste inválidos)
  console.log('\n🗑️  AÇÃO: Deletar registros vazios (dados de teste inválidos)\n');
  
  if (emptyBusinesses.length > 0) {
    const ids = emptyBusinesses.map(b => b.id);
    const { error } = await supabase
      .from('business_data')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.log(`❌ Erro ao deletar business_data: ${error.message}`);
    } else {
      console.log(`✅ ${emptyBusinesses.length} business_data deletados`);
    }
  }
  
  if (emptyProfessionals.length > 0) {
    const ids = emptyProfessionals.map(p => p.id);
    const { error } = await supabase
      .from('professional_data')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.log(`❌ Erro ao deletar professional_data: ${error.message}`);
    } else {
      console.log(`✅ ${emptyProfessionals.length} professional_data deletados`);
    }
  }
  
  // 5. Verificar se restaram registros com Pituba
  const { count: bdRemaining } = await supabase
    .from('business_data')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', FAKE_LOCATION_ID);
  
  const { count: pdRemaining } = await supabase
    .from('professional_data')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', FAKE_LOCATION_ID);
  
  console.log(`\n📊 Registros restantes com Pituba:`);
  console.log(`   business_data: ${bdRemaining || 0}`);
  console.log(`   professional_data: ${pdRemaining || 0}\n`);
  
  if ((bdRemaining || 0) > 0 || (pdRemaining || 0) > 0) {
    console.log('⚠️  ATENÇÃO: Registros restantes têm dados válidos (address_id ou metadata)');
    console.log('   Esses registros precisam de revisão manual\n');
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ REVERSÃO CONCLUÍDA');
  console.log('═══════════════════════════════════════════════════\n');
}

main();
