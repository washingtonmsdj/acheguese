/**
 * Migra business_data legado para modelo canônico
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔄 Migrando business_data para modelo canônico...\n');
  
  // Buscar registros sem location_id
  const { data: businesses, error } = await supabase
    .from('business_data')
    .select('*')
    .is('location_id', null);
  
  if (error) {
    console.error('❌ Erro ao buscar business_data:', error.message);
    process.exit(1);
  }
  
  if (!businesses || businesses.length === 0) {
    console.log('✅ Todos os registros já estão canônicos');
    return;
  }
  
  console.log(`📊 Encontrados ${businesses.length} registros para migrar\n`);
  
  let migrated = 0;
  let failed = 0;
  
  for (const business of businesses) {
    try {
      // Tentar extrair localização do metadata ou campos legados
      let locationSlug: string | null = null;
      
      // 1. Tentar metadata.location
      if (business.metadata?.location) {
        locationSlug = business.metadata.location;
      }
      // 2. Tentar campo neighborhood legado
      else if (business.neighborhood) {
        locationSlug = business.neighborhood.toLowerCase().replace(/\s+/g, '-');
      }
      
      if (!locationSlug) {
        console.log(`⚠️  Business ${business.id}: sem localização identificável`);
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
        console.log(`⚠️  Business ${business.id}: location '${locationSlug}' não encontrada`);
        failed++;
        continue;
      }
      
      // Atualizar com location_id
      const { error: updateError } = await supabase
        .from('business_data')
        .update({ location_id: location.id })
        .eq('id', business.id);
      
      if (updateError) {
        console.log(`❌ Business ${business.id}: erro ao atualizar - ${updateError.message}`);
        failed++;
      } else {
        console.log(`✅ Business ${business.id}: migrado para location ${locationSlug}`);
        migrated++;
      }
      
    } catch (err) {
      console.log(`❌ Business ${business.id}: erro - ${err}`);
      failed++;
    }
  }
  
  console.log(`\n📊 RESULTADO:`);
  console.log(`  Migrados: ${migrated}`);
  console.log(`  Falhas: ${failed}`);
  console.log(`  Total: ${businesses.length}`);
}

main();
