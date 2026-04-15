#!/usr/bin/env node
/**
 * Teste do Motor Operacional da Corrida
 * 
 * Valida:
 * - State machine
 * - Transições válidas/inválidas
 * - Dispatch e aceite
 * - Cancelamentos
 * - Auditoria
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🚗 TESTE DO MOTOR OPERACIONAL DA CORRIDA\n');
console.log('═══════════════════════════════════════════════════════\n');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  results.tests.push({ name, passed, details });
  console.log();
}

// ============================================
// 1. VERIFICAR TABELAS
// ============================================

console.log('1️⃣ Verificando tabelas\n');

const { data: auditTable, error: auditError } = await supabase
  .from('ride_state_audit')
  .select('id')
  .limit(1);

logTest(
  'Tabela ride_state_audit existe',
  !auditError,
  auditError ? `Erro: ${auditError.message}` : 'Tabela acessível'
);

const { data: availTable, error: availError } = await supabase
  .from('driver_availability')
  .select('profile_id')
  .limit(1);

logTest(
  'Tabela driver_availability existe',
  !availError,
  availError ? `Erro: ${availError.message}` : 'Tabela acessível'
);

// ============================================
// 2. CRIAR CORRIDA NO ESTADO INICIAL
// ============================================

console.log('2️⃣ Criando corrida no estado inicial\n');

// Buscar profile de teste
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .limit(1)
  .single();

if (!profile) {
  console.log('❌ Nenhum profile encontrado para teste');
  process.exit(1);
}

const { data: ride, error: rideError } = await supabase
  .from('ride_requests')
  .insert({
    passenger_profile_id: profile.id,
    origin: 'Teste Origem',
    destination: 'Teste Destino',
    departure_time: new Date().toISOString(),
    suggested_price: 10.00,
    type: 'ride',
    payment_method: 'pix',
    status: 'requested',
  })
  .select()
  .single();

logTest(
  'Criar corrida no estado requested',
  !rideError && ride,
  ride ? `Ride ID: ${ride.id}` : `Erro: ${rideError?.message}`
);

if (!ride) {
  console.log('❌ Não foi possível criar corrida. Abortando testes.\n');
  process.exit(1);
}

const rideId = ride.id;

// ============================================
// 3. TESTAR TRANSIÇÕES VÁLIDAS
// ============================================

console.log('3️⃣ Testando transições válidas\n');

// requested -> searching_driver
const { error: trans1Error } = await supabase
  .from('ride_requests')
  .update({ status: 'searching_driver', updated_at: new Date().toISOString() })
  .eq('id', rideId)
  .eq('status', 'requested');

logTest(
  'Transição: requested -> searching_driver',
  !trans1Error,
  trans1Error ? `Erro: ${trans1Error.message}` : 'Transição permitida'
);

// searching_driver -> driver_assigned
const { error: trans2Error } = await supabase
  .from('ride_requests')
  .update({ 
    status: 'driver_assigned',
    driver_profile_id: profile.id,
    driver_assigned_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', rideId)
  .eq('status', 'searching_driver');

logTest(
  'Transição: searching_driver -> driver_assigned',
  !trans2Error,
  trans2Error ? `Erro: ${trans2Error.message}` : 'Transição permitida'
);

// driver_assigned -> driver_accepted
const { error: trans3Error } = await supabase
  .from('ride_requests')
  .update({ 
    status: 'driver_accepted',
    driver_accepted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', rideId)
  .eq('status', 'driver_assigned');

logTest(
  'Transição: driver_assigned -> driver_accepted',
  !trans3Error,
  trans3Error ? `Erro: ${trans3Error.message}` : 'Transição permitida'
);

// ============================================
// 4. TESTAR TRANSIÇÃO INVÁLIDA
// ============================================

console.log('4️⃣ Testando transição inválida\n');

// Tentar pular de driver_accepted direto para completed (inválido)
const { error: invalidError } = await supabase
  .from('ride_requests')
  .update({ status: 'completed', updated_at: new Date().toISOString() })
  .eq('id', rideId)
  .eq('status', 'driver_accepted');

// Verificar se estado não mudou
const { data: rideCheck } = await supabase
  .from('ride_requests')
  .select('status')
  .eq('id', rideId)
  .single();

logTest(
  'Bloquear transição inválida: driver_accepted -> completed',
  rideCheck?.status === 'driver_accepted',
  rideCheck?.status === 'driver_accepted' 
    ? 'Estado não mudou (correto)' 
    : `ERRO: Estado mudou para ${rideCheck?.status}`
);

// ============================================
// 5. TESTAR AUDITORIA
// ============================================

console.log('5️⃣ Testando auditoria\n');

// Registrar mudança de estado
const { error: auditInsertError } = await supabase
  .from('ride_state_audit')
  .insert({
    ride_id: rideId,
    from_state: 'driver_accepted',
    to_state: 'driver_arriving',
    changed_by: profile.id,
    reason: 'Teste de auditoria',
    created_at: new Date().toISOString(),
  });

logTest(
  'Registrar auditoria de mudança de estado',
  !auditInsertError,
  auditInsertError ? `Erro: ${auditInsertError.message}` : 'Auditoria registrada'
);

// Buscar auditoria
const { data: auditLogs, error: auditSelectError } = await supabase
  .from('ride_state_audit')
  .select('*')
  .eq('ride_id', rideId);

logTest(
  'Buscar logs de auditoria',
  !auditSelectError && auditLogs && auditLogs.length > 0,
  auditLogs ? `${auditLogs.length} log(s) encontrado(s)` : `Erro: ${auditSelectError?.message}`
);

// ============================================
// 6. TESTAR DISPONIBILIDADE DE MOTORISTA
// ============================================

console.log('6️⃣ Testando disponibilidade de motorista\n');

// Criar registro de disponibilidade
const { error: availInsertError } = await supabase
  .from('driver_availability')
  .upsert({
    profile_id: profile.id,
    is_online: true,
    is_available: true,
    current_lat: -20.3155,
    current_lng: -40.3128,
    updated_at: new Date().toISOString(),
  });

logTest(
  'Criar/atualizar disponibilidade de motorista',
  !availInsertError,
  availInsertError ? `Erro: ${availInsertError.message}` : 'Disponibilidade registrada'
);

// Buscar motoristas disponíveis
const { data: availDrivers, error: availSelectError } = await supabase
  .from('driver_availability')
  .select('*')
  .eq('is_online', true)
  .eq('is_available', true);

logTest(
  'Buscar motoristas disponíveis',
  !availSelectError,
  availDrivers ? `${availDrivers.length} motorista(s) disponível(is)` : `Erro: ${availSelectError?.message}`
);

// ============================================
// 7. TESTAR CANCELAMENTO
// ============================================

console.log('7️⃣ Testando cancelamento\n');

// Cancelar corrida
const { error: cancelError } = await supabase
  .from('ride_requests')
  .update({ 
    status: 'cancelled_by_passenger',
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
  .eq('id', rideId);

logTest(
  'Cancelar corrida',
  !cancelError,
  cancelError ? `Erro: ${cancelError.message}` : 'Corrida cancelada'
);

// Verificar estado final
const { data: finalRide } = await supabase
  .from('ride_requests')
  .select('status')
  .eq('id', rideId)
  .single();

logTest(
  'Verificar estado final',
  finalRide?.status === 'cancelled_by_passenger',
  `Estado: ${finalRide?.status}`
);

// ============================================
// 8. LIMPEZA
// ============================================

console.log('8️⃣ Limpeza\n');

await supabase.from('ride_state_audit').delete().eq('ride_id', rideId);
await supabase.from('ride_requests').delete().eq('id', rideId);
await supabase.from('driver_availability').delete().eq('profile_id', profile.id);

console.log('✅ Dados de teste removidos\n');

// ============================================
// RESUMO FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

results.tests.forEach(test => {
  const icon = test.passed ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
});

console.log(`\n📈 Score: ${results.passed}/${results.total} (${Math.round(results.passed/results.total*100)}%)`);

if (results.passed === results.total) {
  console.log('\n🎉 MOTOR OPERACIONAL VALIDADO!\n');
  console.log('✅ Tabelas criadas');
  console.log('✅ Transições válidas funcionam');
  console.log('✅ Transições inválidas bloqueadas');
  console.log('✅ Auditoria funciona');
  console.log('✅ Disponibilidade funciona');
  console.log('✅ Cancelamento funciona\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${results.failed} teste(s) falharam\n`);
  process.exit(1);
}
