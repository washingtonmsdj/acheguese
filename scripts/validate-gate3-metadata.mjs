/**
 * GATE 3: Validação Operacional de Failed Delivery Metadata
 * 
 * Executa testes automatizados no banco para validar:
 * - Estrutura criada (coluna, constraints, índices)
 * - Snapshot válido aceito
 * - Casos inválidos bloqueados
 * - Resolução posterior funcionando
 */

import { createServiceRoleClient } from './lib/supabase-client.mjs';

const supabase = createServiceRoleClient({ envFiles: ['.env.test', '.env.local', '.env.remote', '.env'] });

console.log('========================================');
console.log('GATE 3: VALIDAÇÃO OPERACIONAL');
console.log('========================================\n');

// ============================================
// 1. VERIFICAR ESTRUTURA
// ============================================

console.log('1. Verificando estrutura do banco...\n');

// Verificar coluna tentando consultar diretamente
const { data: testQuery, error: testError } = await supabase
  .from('ride_requests')
  .select('id, failed_delivery_metadata')
  .limit(1);

if (testError && testError.message.includes('failed_delivery_metadata')) {
  console.log('❌ Coluna failed_delivery_metadata não encontrada\n');
  process.exit(1);
} else {
  console.log('✅ Coluna failed_delivery_metadata existe\n');
}

// ============================================
// 2. CRIAR CORRIDA DE TESTE
// ============================================

console.log('2. Criando corrida de teste...\n');

// Buscar IDs necessários
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('profile_type', 'personal')
  .limit(1)
  .single();

const { data: addresses } = await supabase
  .from('addresses')
  .select('id')
  .limit(2);

const { data: location } = await supabase
  .from('locations')
  .select('id')
  .eq('type', 'city')
  .limit(1)
  .single();

if (!profile || !addresses || addresses.length < 2 || !location) {
  console.log('❌ Dados necessários não encontrados no banco');
  console.log('   Certifique-se de ter profiles, addresses e locations');
  process.exit(1);
}

// Criar corrida de teste
const { data: testRide, error: createError } = await supabase
  .from('ride_requests')
  .insert({
    passenger_profile_id: profile.id,
    pickup_address_id: addresses[0].id,
    dropoff_address_id: addresses[1].id,
    pickup_location_id: location.id,
    dropoff_location_id: location.id,
    status: 'searching_driver',
    ride_mode: 'motoboy',
    suggested_price: 15.00
  })
  .select()
  .single();

if (createError) {
  console.log('❌ Erro ao criar corrida de teste:', createError.message);
  process.exit(1);
}

const testRideId = testRide.id;
console.log(`✅ Corrida de teste criada: ${testRideId}\n`);

// ============================================
// 3. TESTE: SNAPSHOT VÁLIDO
// ============================================

console.log('3. Testando snapshot válido (deve aceitar)...\n');

const { error: test1Error } = await supabase
  .from('ride_requests')
  .update({
    status: 'failed_delivery',
    failed_delivery_at: new Date().toISOString(),
    failed_delivery_reason: 'recipient_unavailable',
    failed_delivery_metadata: {
      failure_reason: 'recipient_unavailable',
      item_destination: 'return_to_sender',
      item_current_holder: 'driver',
      timestamp: new Date().toISOString(),
      resolution_status: 'pending'
    }
  })
  .eq('id', testRideId);

if (test1Error) {
  console.log('❌ Snapshot válido foi rejeitado:', test1Error.message);
  await cleanup(testRideId);
  process.exit(1);
}

console.log('✅ Snapshot válido aceito pelo banco\n');

// Verificar dados gravados
const { data: verifyData } = await supabase
  .from('ride_requests')
  .select('status, failed_delivery_metadata')
  .eq('id', testRideId)
  .single();

console.log('   Dados gravados:');
console.log(`   - status: ${verifyData.status}`);
console.log(`   - failure_reason: ${verifyData.failed_delivery_metadata.failure_reason}`);
console.log(`   - item_destination: ${verifyData.failed_delivery_metadata.item_destination}`);
console.log(`   - resolution_status: ${verifyData.failed_delivery_metadata.resolution_status}\n`);

// ============================================
// 4. TESTE: failure_reason = other sem notes
// ============================================

console.log('4. Testando failure_reason = other sem notes (deve bloquear)...\n');

const { error: test2Error } = await supabase
  .from('ride_requests')
  .update({
    failed_delivery_metadata: {
      failure_reason: 'other',
      item_destination: 'return_to_sender',
      item_current_holder: 'driver',
      timestamp: new Date().toISOString(),
      resolution_status: 'pending'
    }
  })
  .eq('id', testRideId);

if (test2Error) {
  console.log('✅ Bloqueio funcionando:', test2Error.message);
  console.log('   Constraint: check_failed_delivery_other_notes\n');
} else {
  console.log('❌ Deveria ter bloqueado mas aceitou\n');
  await cleanup(testRideId);
  process.exit(1);
}

// ============================================
// 5. TESTE: item_current_holder = recipient
// ============================================

console.log('5. Testando item_current_holder = recipient (deve bloquear)...\n');

const { error: test3Error } = await supabase
  .from('ride_requests')
  .update({
    failed_delivery_metadata: {
      failure_reason: 'recipient_unavailable',
      item_destination: 'return_to_sender',
      item_current_holder: 'recipient',
      timestamp: new Date().toISOString(),
      resolution_status: 'pending'
    }
  })
  .eq('id', testRideId);

if (test3Error) {
  console.log('✅ Bloqueio funcionando:', test3Error.message);
  console.log('   Constraint: check_failed_delivery_holder\n');
} else {
  console.log('❌ Deveria ter bloqueado mas aceitou\n');
  await cleanup(testRideId);
  process.exit(1);
}

// ============================================
// 6. TESTE: resolved sem resolved_at
// ============================================

console.log('6. Testando resolved sem resolved_at (deve bloquear)...\n');

const { error: test4Error } = await supabase
  .from('ride_requests')
  .update({
    failed_delivery_metadata: {
      failure_reason: 'recipient_unavailable',
      item_destination: 'return_to_sender',
      item_current_holder: 'driver',
      timestamp: new Date().toISOString(),
      resolution_status: 'resolved'
    }
  })
  .eq('id', testRideId);

if (test4Error) {
  console.log('✅ Bloqueio funcionando:', test4Error.message);
  console.log('   Constraint: check_failed_delivery_resolved\n');
} else {
  console.log('❌ Deveria ter bloqueado mas aceitou\n');
  await cleanup(testRideId);
  process.exit(1);
}

// ============================================
// 7. TESTE: Atualizar para in_progress
// ============================================

console.log('7. Testando atualização para in_progress (deve aceitar)...\n');

// Buscar metadata atual
const { data: currentData } = await supabase
  .from('ride_requests')
  .select('failed_delivery_metadata')
  .eq('id', testRideId)
  .single();

const { error: test5Error } = await supabase
  .from('ride_requests')
  .update({
    failed_delivery_metadata: {
      ...currentData.failed_delivery_metadata,
      resolution_status: 'in_progress',
      next_ride_id: '123e4567-e89b-12d3-a456-426614174000'
    }
  })
  .eq('id', testRideId);

if (test5Error) {
  console.log('❌ Atualização para in_progress foi rejeitada:', test5Error.message);
  await cleanup(testRideId);
  process.exit(1);
}

console.log('✅ Atualização para in_progress aceita\n');

// ============================================
// 8. TESTE: Atualizar para resolved
// ============================================

console.log('8. Testando atualização para resolved (deve aceitar)...\n');

// Buscar metadata atual
const { data: currentData2 } = await supabase
  .from('ride_requests')
  .select('failed_delivery_metadata')
  .eq('id', testRideId)
  .single();

const { error: test6Error } = await supabase
  .from('ride_requests')
  .update({
    failed_delivery_metadata: {
      ...currentData2.failed_delivery_metadata,
      resolution_status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_action_notes: 'Item devolvido com sucesso'
    }
  })
  .eq('id', testRideId);

if (test6Error) {
  console.log('❌ Atualização para resolved foi rejeitada:', test6Error.message);
  await cleanup(testRideId);
  process.exit(1);
}

console.log('✅ Atualização para resolved aceita\n');

// Verificar estado final
const { data: finalData } = await supabase
  .from('ride_requests')
  .select('failed_delivery_metadata')
  .eq('id', testRideId)
  .single();

console.log('   Estado final:');
console.log(`   - resolution_status: ${finalData.failed_delivery_metadata.resolution_status}`);
console.log(`   - resolved_at: ${finalData.failed_delivery_metadata.resolved_at}`);
console.log(`   - notes: ${finalData.failed_delivery_metadata.resolution_action_notes}\n`);

// ============================================
// 9. LIMPEZA
// ============================================

await cleanup(testRideId);

// ============================================
// RELATÓRIO FINAL
// ============================================

console.log('========================================');
console.log('GATE 3: VALIDAÇÃO COMPLETA ✅');
console.log('========================================\n');
console.log('ESTRUTURA:');
console.log('  ✅ Coluna failed_delivery_metadata criada');
console.log('  ✅ Constraints funcionando');
console.log('\nVALIDAÇÕES:');
console.log('  ✅ Snapshot válido aceito');
console.log('  ✅ failure_reason = other sem notes bloqueado');
console.log('  ✅ item_current_holder = recipient bloqueado');
console.log('  ✅ resolved sem resolved_at bloqueado');
console.log('  ✅ Atualização para in_progress funcionando');
console.log('  ✅ Atualização para resolved funcionando');
console.log('\n========================================');
console.log('VEREDITO: VALIDAÇÃO OPERACIONAL COMPLETA ✅');
console.log('========================================\n');

process.exit(0);

// ============================================
// HELPER
// ============================================

async function cleanup(rideId) {
  console.log('9. Limpando dados de teste...\n');
  await supabase
    .from('ride_requests')
    .delete()
    .eq('id', rideId);
  console.log('✅ Limpeza concluída\n');
}
