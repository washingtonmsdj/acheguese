/**
 * Atribui location padrão a registros vazios de business_data e professional_data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Location padrão: Pituba
const DEFAULT_LOCATION_ID = '384add59-4e53-489d-a7b5-97dea2b3f442';

async function fixBusinessData() {
  console.log('🔄 Corrigindo business_data...\n');
  
  const { data: businesses, error } = await supabase
    .from('business_data')
    .select('id')
    .is('location_id', null);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return 0;
  }
  
  if (!businesses || businesses.length === 0) {
    console.log('✅ Nenhum registro para corrigir');
    return 0;
  }
  
  console.log(`📊 Encontrados ${businesses.length} registros vazios`);
  console.log(`🔧 Atribuindo location padrão (Pituba)...\n`);
  
  const { error: updateError } = await supabase
    .from('business_data')
    .update({ location_id: DEFAULT_LOCATION_ID })
    .is('location_id', null);
  
  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError.message);
    return 0;
  }
  
  console.log(`✅ ${businesses.length} registros atualizados\n`);
  return businesses.length;
}

async function fixProfessionalData() {
  console.log('🔄 Corrigindo professional_data...\n');
  
  const { data: professionals, error } = await supabase
    .from('professional_data')
    .select('id')
    .is('location_id', null);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return 0;
  }
  
  if (!professionals || professionals.length === 0) {
    console.log('✅ Nenhum registro para corrigir');
    return 0;
  }
  
  console.log(`📊 Encontrados ${professionals.length} registros vazios`);
  console.log(`🔧 Atribuindo location padrão (Pituba)...\n`);
  
  const { error: updateError } = await supabase
    .from('professional_data')
    .update({ location_id: DEFAULT_LOCATION_ID })
    .is('location_id', null);
  
  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError.message);
    return 0;
  }
  
  console.log(`✅ ${professionals.length} registros atualizados\n`);
  return professionals.length;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CORREÇÃO DE REGISTROS VAZIOS');
  console.log('═══════════════════════════════════════════════════\n');
  
  const businessFixed = await fixBusinessData();
  const professionalFixed = await fixProfessionalData();
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  business_data: ${businessFixed} registros corrigidos`);
  console.log(`  professional_data: ${professionalFixed} registros corrigidos`);
  console.log(`  Total: ${businessFixed + professionalFixed} registros\n`);
}

main();
