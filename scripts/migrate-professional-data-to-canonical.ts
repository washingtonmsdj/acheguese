/**
 * Migra professional_data legado para modelo canônico
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔄 Migrando professional_data para modelo canônico...\n');
  
  // Buscar registros sem location_id
  const { data: professionals, error } = await supabase
    .from('professional_data')
    .select('*')
    .is('location_id', null);
  
  if (error) {
    console.error('❌ Erro ao buscar professional_data:', error.message);
    process.exit(1);
  }
  
  if (!professionals || professionals.length === 0) {
    console.log('✅ Todos os registros já estão canônicos');
    return;
  }
  
  console.log(`📊 Encontrados ${professionals.length} registros para migrar\n`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const professional of professionals) {
    try {
      // Tentar extrair localização do metadata.location
      let locationSlug: string | null = null;
      
      if (professional.metadata?.location) {
        locationSlug = professional.metadata.location;
      }
      
      if (!locationSlug) {
        console.log(`⚠️  Professional ${professional.id}: sem localização identificável`);
        failed++;
        continue;
      }
      
      // Buscar location correspondente
      const { data: location } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', locationSlug)
        .eq('type', 'district')
        .eq('status', 'active')
        .single();
      
      if (!location) {
        console.log(`⚠️  Professional ${professional.id}: location '${locationSlug}' não encontrada`);
        failed++;
        continue;
      }
      
      // Atualizar com location_id
      const { error: updateError } = await supabase
        .from('professional_data')
        .update({ location_id: location.id })
        .eq('id', professional.id);
      
      if (updateError) {
        console.log(`❌ Professional ${professional.id}: erro ao atualizar - ${updateError.message}`);
        failed++;
      } else {
        console.log(`✅ Professional ${professional.id}: migrado para location ${locationSlug}`);
        migrated++;
      }
      
    } catch (err) {
      console.log(`❌ Professional ${professional.id}: erro - ${err}`);
      failed++;
    }
  }
  
  console.log(`\n📊 RESULTADO:`);
  console.log(`  Migrados: ${migrated}`);
  console.log(`  Falhas: ${failed}`);
  console.log(`  Total: ${professionals.length}`);
}

main();
