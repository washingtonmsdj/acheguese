/**
 * Validação final de constraints com estratégia adequada para RLS
 */

import { createServiceRoleClient } from '../tools/supabase/supabase-client';

const supabase = createServiceRoleClient();

async function validateBusinessDataConstraint() {
  console.log('\n🧪 Validando business_data.location_id NOT NULL...');
  
  // Estratégia: tentar UPDATE com location_id = NULL em registro existente
  const { data: existing } = await supabase
    .from('business_data')
    .select('id')
    .limit(1)
    .single();
  
  if (!existing) {
    console.log('  ⚠️  Nenhum registro para testar (tabela vazia)');
    return true;
  }
  
  // Tentar setar NULL (deve falhar)
  const { error } = await supabase
    .from('business_data')
    .update({ location_id: null })
    .eq('id', existing.id);
  
  if (error && error.message.includes('null value')) {
    console.log('  ✅ Constraint NOT NULL ativo');
    return true;
  } else if (error) {
    console.log(`  ⚠️  Erro diferente: ${error.message}`);
    return false;
  } else {
    console.log('  ❌ Constraint NOT NULL NÃO está ativo');
    return false;
  }
}

async function validateProfessionalDataConstraint() {
  console.log('\n🧪 Validando professional_data.location_id NOT NULL...');
  
  // Estratégia: tentar UPDATE com location_id = NULL em registro existente
  const { data: existing } = await supabase
    .from('professional_data')
    .select('id')
    .limit(1)
    .single();
  
  if (!existing) {
    console.log('  ⚠️  Nenhum registro para testar (tabela vazia)');
    return true;
  }
  
  // Tentar setar NULL (deve falhar)
  const { error } = await supabase
    .from('professional_data')
    .update({ location_id: null })
    .eq('id', existing.id);
  
  if (error && error.message.includes('null value')) {
    console.log('  ✅ Constraint NOT NULL ativo');
    return true;
  } else if (error) {
    console.log(`  ⚠️  Erro diferente: ${error.message}`);
    return false;
  } else {
    console.log('  ❌ Constraint NOT NULL NÃO está ativo');
    return false;
  }
}

async function validateUserResidencesConstraint() {
  console.log('\n🧪 Validando user_residences constraints...');
  
  // Tabela vazia, mas podemos validar via tentativa de INSERT
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.log('  ⚠️  Nenhum profile para testar');
    return true;
  }
  
  const testLocationId = '384add59-4e53-489d-a7b5-97dea2b3f442';
  
  // Tentar inserir sem address_id (deve falhar)
  const { error } = await supabase
    .from('user_residences')
    .insert({
      user_id: profile.id,
      location_id: testLocationId,
      // address_id ausente
    });
  
  if (error && error.message.includes('null value') && error.message.includes('address_id')) {
    console.log('  ✅ Constraint address_id NOT NULL ativo');
    return true;
  } else if (error) {
    console.log(`  ⚠️  Erro diferente: ${error.message}`);
    return false;
  } else {
    console.log('  ❌ Constraint NOT NULL NÃO está ativo');
    return false;
  }
}

async function validateRideRequestsConstraint() {
  console.log('\n🧪 Validando ride_requests constraints...');
  
  // Tabela vazia, mas podemos validar via tentativa de INSERT
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.log('  ⚠️  Nenhum profile para testar');
    return true;
  }
  
  const testAddressId = '00000000-0000-0000-0000-000000000002';
  const testLocationId = '384add59-4e53-489d-a7b5-97dea2b3f442';
  
  // Tentar inserir sem pickup_address_id (deve falhar)
  const { error } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: profile.id,
      dropoff_address_id: testAddressId,
      pickup_location_id: testLocationId,
      dropoff_location_id: testLocationId,
      // pickup_address_id ausente
    });
  
  if (error && error.message.includes('null value') && error.message.includes('pickup_address_id')) {
    console.log('  ✅ Constraint pickup_address_id NOT NULL ativo');
    return true;
  } else if (error) {
    console.log(`  ⚠️  Erro diferente: ${error.message}`);
    return false;
  } else {
    console.log('  ❌ Constraint NOT NULL NÃO está ativo');
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  VALIDAÇÃO FINAL DE CONSTRAINTS');
  console.log('═══════════════════════════════════════════════════');
  
  const results = {
    business_data: await validateBusinessDataConstraint(),
    professional_data: await validateProfessionalDataConstraint(),
    user_residences: await validateUserResidencesConstraint(),
    ride_requests: await validateRideRequestsConstraint(),
  };
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════════════\n');
  
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([table, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${table}`);
  });
  
  if (allPassed) {
    console.log('\n✅ TODOS OS CONSTRAINTS VALIDADOS\n');
  } else {
    console.log('\n⚠️  ALGUNS CONSTRAINTS FALHARAM\n');
  }
}

main();
