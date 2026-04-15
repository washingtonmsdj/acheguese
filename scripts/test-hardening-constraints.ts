/**
 * Testa constraints de hardening no banco remoto
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testBusinessDataConstraints() {
  console.log('\n🧪 Testando business_data constraints...');
  
  // Buscar um profile_id válido
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.log('  ⚠️  Nenhum profile encontrado, pulando teste');
    return true;
  }
  
  // Tentar inserir sem location_id (deve falhar)
  const { error } = await supabase
    .from('business_data')
    .insert({
      profile_id: profile.id,
      // location_id ausente - deve falhar
    });
  
  if (error) {
    if (error.message.includes('null value') && error.message.includes('location_id')) {
      console.log('  ✅ NOT NULL em location_id funcionando');
      return true;
    } else {
      console.log(`  ⚠️  Erro diferente: ${error.message}`);
      return false;
    }
  } else {
    console.log('  ❌ NOT NULL em location_id NÃO está ativo');
    return false;
  }
}

async function testProfessionalDataConstraints() {
  console.log('\n🧪 Testando professional_data constraints...');
  
  // Buscar um profile_id válido
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.log('  ⚠️  Nenhum profile encontrado, pulando teste');
    return true;
  }
  
  // Tentar inserir sem location_id (deve falhar)
  const { error } = await supabase
    .from('professional_data')
    .insert({
      profile_id: profile.id,
      // location_id ausente - deve falhar
    });
  
  if (error) {
    if (error.message.includes('null value') && error.message.includes('location_id')) {
      console.log('  ✅ NOT NULL em location_id funcionando');
      return true;
    } else {
      console.log(`  ⚠️  Erro diferente: ${error.message}`);
      return false;
    }
  } else {
    console.log('  ❌ NOT NULL em location_id NÃO está ativo');
    return false;
  }
}

async function testUserResidencesConstraints() {
  console.log('\n🧪 Testando user_residences constraints...');
  
  // Buscar um user_id válido (da tabela auth.users ou criar um UUID de teste)
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testLocationId = '384add59-4e53-489d-a7b5-97dea2b3f442'; // Pituba
  
  // Tentar inserir sem address_id (deve falhar)
  const { error } = await supabase
    .from('user_residences')
    .insert({
      user_id: testUserId,
      location_id: testLocationId,
      // address_id ausente - deve falhar
    });
  
  if (error) {
    if (error.message.includes('null value') && error.message.includes('address_id')) {
      console.log('  ✅ NOT NULL em address_id funcionando');
      return true;
    } else {
      console.log(`  ⚠️  Erro diferente: ${error.message}`);
      return false;
    }
  } else {
    console.log('  ❌ NOT NULL em address_id NÃO está ativo');
    return false;
  }
}

async function testRideRequestsConstraints() {
  console.log('\n🧪 Testando ride_requests constraints...');
  
  // Buscar um profile_id válido
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.log('  ⚠️  Nenhum profile encontrado, pulando teste');
    return true;
  }
  
  const testAddressId = '00000000-0000-0000-0000-000000000002';
  const testLocationId = '384add59-4e53-489d-a7b5-97dea2b3f442'; // Pituba
  
  // Tentar inserir sem pickup_address_id (deve falhar)
  const { error } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: profile.id,
      dropoff_address_id: testAddressId,
      pickup_location_id: testLocationId,
      dropoff_location_id: testLocationId,
      // pickup_address_id ausente - deve falhar
    });
  
  if (error) {
    if (error.message.includes('null value') && error.message.includes('pickup_address_id')) {
      console.log('  ✅ NOT NULL em pickup_address_id funcionando');
      return true;
    } else {
      console.log(`  ⚠️  Erro diferente: ${error.message}`);
      return false;
    }
  } else {
    console.log('  ❌ NOT NULL em pickup_address_id NÃO está ativo');
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TESTE DE CONSTRAINTS DE HARDENING');
  console.log('═══════════════════════════════════════════════════');
  
  const results = {
    business_data: await testBusinessDataConstraints(),
    professional_data: await testProfessionalDataConstraints(),
    user_residences: await testUserResidencesConstraints(),
    ride_requests: await testRideRequestsConstraints(),
  };
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  RESUMO');
  console.log('═══════════════════════════════════════════════════');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n✅ TODOS OS CONSTRAINTS ESTÃO ATIVOS\n');
  } else {
    console.log('\n⚠️  ALGUNS CONSTRAINTS NÃO ESTÃO ATIVOS\n');
    Object.entries(results).forEach(([table, passed]) => {
      if (!passed) {
        console.log(`  ❌ ${table}`);
      }
    });
  }
}

main();
