/**
 * Valida e remove metadata.location legado de professional_data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CLEANUP DE metadata.location LEGADO');
  console.log('═══════════════════════════════════════════════════\n');
  
  // 1. Verificar registros com metadata.location
  console.log('🔍 Verificando professional_data com metadata.location...\n');
  
  const { data: withMetadataLocation, error } = await supabase
    .from('professional_data')
    .select('id, metadata, location_id');
  
  if (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
  
  const hasMetadataLocation = withMetadataLocation?.filter(p => 
    p.metadata && typeof p.metadata === 'object' && 'location' in p.metadata
  ) || [];
  
  console.log(`📊 Total de registros: ${withMetadataLocation?.length || 0}`);
  console.log(`📊 Com metadata.location: ${hasMetadataLocation.length}\n`);
  
  if (hasMetadataLocation.length === 0) {
    console.log('✅ Nenhum registro com metadata.location legado\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ CLEANUP JÁ CONCLUÍDO');
    console.log('═══════════════════════════════════════════════════\n');
    return;
  }
  
  // 2. Mostrar registros afetados
  console.log('📋 Registros com metadata.location:');
  hasMetadataLocation.forEach(p => {
    console.log(`  - ${p.id}`);
    console.log(`    metadata.location: ${p.metadata.location}`);
    console.log(`    location_id: ${p.location_id || 'NULL'}\n`);
  });
  
  // 3. Remover metadata.location
  console.log('🔧 Removendo metadata.location...\n');
  
  for (const record of hasMetadataLocation) {
    const cleanMetadata = { ...record.metadata };
    delete cleanMetadata.location;
    
    const { error: updateError } = await supabase
      .from('professional_data')
      .update({ metadata: cleanMetadata })
      .eq('id', record.id);
    
    if (updateError) {
      console.log(`❌ Erro ao limpar ${record.id}: ${updateError.message}`);
    } else {
      console.log(`✅ ${record.id} - metadata.location removido`);
    }
  }
  
  // 4. Verificação final
  console.log('\n🔍 Verificação final...\n');
  
  const { data: finalCheck } = await supabase
    .from('professional_data')
    .select('id, metadata');
  
  const stillHasMetadataLocation = finalCheck?.filter(p => 
    p.metadata && typeof p.metadata === 'object' && 'location' in p.metadata
  ) || [];
  
  console.log(`📊 Registros com metadata.location após cleanup: ${stillHasMetadataLocation.length}\n`);
  
  if (stillHasMetadataLocation.length === 0) {
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ CLEANUP CONCLUÍDO COM SUCESSO');
    console.log('═══════════════════════════════════════════════════\n');
  } else {
    console.log('⚠️  Ainda há registros com metadata.location\n');
  }
}

main();
