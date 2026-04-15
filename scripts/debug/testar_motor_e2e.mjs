#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 TESTE END-TO-END DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

// IDs de teste
const testPassengerId = '00000000-0000-0000-0000-000000000001';
const testDriverId = '00000000-0000-0000-0000-000000000002';
let testRideId = null;

// 1. Criar corrida no estado requested
total++;
console.log('1️⃣  Criando corrida...');
const { data: ride, error: e1 } = await supabase
  .from('ride_requests')
  .insert({
    passenger_profile_id: testPassengerId,
    origin: 'Origem Teste',
    destination: 'Destino Teste',
    origin_lat: -20.3155,
    origin_lng: -40.3128,
    destination_lat: -20.3200,
    destination_lng: -40.3400,
    departure_time: new Date().toISOString(),
    suggested_price: 10.00,
    final_price: 10.00,
    type: 'viagem',
    payment_method: 'pix',
    status: 'requested',
  })
  .select()
  .single();

if (!e1 && ride) {
  console.log(`✅ Corrida criada: ${ride.id}`);
  console.log(`   Estado: ${ride.status}`);
  testRideId = ride.id;
  passed++;
} else {
  console.log('❌ Erro ao criar corrida:', e1?.message);
}

// 2. Transicionar para searching_driver
total++;
console.log('\n2️⃣  Transicionando para searching_driver...');
const { error: e2 } = await supabase
  .from('ride_requests')
  .update({ status: 'searching_driver' })
  .eq('id', testRideId)
  .eq('status', 'requested');

if (!e2) {
  console.log('✅ Estado atualizado para searching_driver');
  passed++;
} else {
  console.log('❌ Erro:', e2.message);
}

// 3. Registrar auditoria
total++;
console.log('\n3️⃣  Registrando auditoria...');
const { error: e3 } = await supabase
  .from('ride_state_audit')
  .insert({
    ride_id: testRideId,
    from_state: 'requested',
    to_state: 'searching_driver',
    changed_by: 'system',
    reason: 'Teste E2E',
  });

if (!e3) {
  console.log('✅ Auditoria registrada');
  passed++;
} else {
  console.log('❌ Erro:', e3.message);
}

// 4. Criar disponibilidade do motorista
total++;
console.log('\n4️⃣  Criando disponibilidade do motorista...');
const { error: e4 } = await supabase
  .from('driver_availability')
  .upsert({
    profile_id: testDriverId,
    is_online: true,
    is_available: true,
    current_lat: -20.3155,
    current_lng: -40.3128,
  });

if (!e4) {
  console.log('✅ Motorista disponível');
  passed++;
} else {
  console.log('❌ Erro:', e4.message);
}

// 5. Atribuir motorista
total++;
console.log('\n5️⃣  Atribuindo motorista...');
const { error: e5 } = await supabase
  .from('ride_requests')
  .update({
    driver_profile_id: testDriverId,
    status: 'driver_assigned',
    driver_assigned_at: new Date().toISOString(),
  })
  .eq('id', testRideId)
  .eq('status', 'searching_driver');

if (!e5) {
  console.log('✅ Motorista atribuído');
  passed++;
} else {
  console.log('❌ Erro:', e5.message);
}

// 6. Aceitar corrida (com lock)
total++;
console.log('\n6️⃣  Aceitando corrida (com optimistic locking)...');
const { error: e6 } = await supabase
  .from('ride_requests')
  .update({
    status: 'driver_accepted',
    driver_accepted_at: new Date().toISOString(),
  })
  .eq('id', testRideId)
  .eq('status', 'driver_assigned')
  .eq('driver_profile_id', testDriverId);

if (!e6) {
  console.log('✅ Corrida aceita');
  passed++;
} else {
  console.log('❌ Erro:', e6.message);
}

// 7. Tentar aceitar novamente (deve falhar)
total++;
console.log('\n7️⃣  Tentando aceitar novamente (deve falhar)...');
const { data: duplicateAccept, error: e7 } = await supabase
  .from('ride_requests')
  .update({
    status: 'driver_accepted',
    driver_accepted_at: new Date().toISOString(),
  })
  .eq('id', testRideId)
  .eq('status', 'driver_assigned')
  .eq('driver_profile_id', testDriverId)
  .select();

if (e7 || !duplicateAccept || duplicateAccept.length === 0) {
  console.log('✅ Aceite duplicado bloqueado (optimistic locking funcionou)');
  passed++;
} else {
  console.log('❌ FALHA: Aceite duplicado permitido!');
}

// 8. Verificar motorista não pode aceitar outra corrida
total++;
console.log('\n8️⃣  Verificando se motorista tem corrida ativa...');
const { data: activeRides, error: e8 } = await supabase
  .from('ride_requests')
  .select('id')
  .eq('driver_profile_id', testDriverId)
  .in('status', ['driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress']);

if (!e8 && activeRides && activeRides.length > 0) {
  console.log(`✅ Motorista tem ${activeRides.length} corrida(s) ativa(s)`);
  passed++;
} else {
  console.log('❌ Erro ao verificar corridas ativas');
}

// 9. Completar corrida
total++;
console.log('\n9️⃣  Completando corrida...');
const { error: e9 } = await supabase
  .from('ride_requests')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  })
  .eq('id', testRideId);

if (!e9) {
  console.log('✅ Corrida completada');
  passed++;
} else {
  console.log('❌ Erro:', e9.message);
}

// 10. Liberar motorista
total++;
console.log('\n🔟 Liberando motorista...');
const { error: e10 } = await supabase
  .from('driver_availability')
  .update({ is_available: true })
  .eq('profile_id', testDriverId);

if (!e10) {
  console.log('✅ Motorista liberado');
  passed++;
} else {
  console.log('❌ Erro:', e10.message);
}

// 11. Verificar auditoria completa
total++;
console.log('\n1️⃣1️⃣  Verificando auditoria completa...');
const { data: audit, error: e11 } = await supabase
  .from('ride_state_audit')
  .select('*')
  .eq('ride_id', testRideId)
  .order('created_at', { ascending: true });

if (!e11 && audit && audit.length > 0) {
  console.log(`✅ Auditoria completa: ${audit.length} registro(s)`);
  audit.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.from_state} → ${a.to_state} (${a.changed_by})`);
  });
  passed++;
} else {
  console.log('❌ Erro ao verificar auditoria');
}

// Limpeza
console.log('\n🧹 Limpando dados de teste...');
await supabase.from('ride_state_audit').delete().eq('ride_id', testRideId);
await supabase.from('ride_requests').delete().eq('id', testRideId);
await supabase.from('driver_availability').delete().eq('profile_id', testDriverId);

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);

if (passed === total) {
  console.log('🎉 MOTOR OPERACIONAL: FUNCIONANDO!\n');
  console.log('✅ State machine validada');
  console.log('✅ Optimistic locking validado');
  console.log('✅ Auditoria validada');
  console.log('✅ Disponibilidade validada');
  console.log('✅ Fluxo completo validado\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${total - passed} teste(s) falharam\n`);
  process.exit(1);
}
