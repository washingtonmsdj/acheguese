#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔥 VALIDAÇÃO REAL DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');

const testRideId = '00000000-0000-0000-0000-000000000099';
const testPassengerId = '00000000-0000-0000-0000-000000000001';
const testDriverId = '00000000-0000-0000-0000-000000000002';

let passed = 0;
let total = 0;

// Limpeza inicial
console.log('🧹 Limpeza inicial...');
await supabase.from('ride_state_audit').delete().eq('ride_id', testRideId);
await supabase.from('ride_requests').delete().eq('id', testRideId);
await supabase.from('driver_availability').delete().eq('profile_id', testDriverId);
console.log('✅ Limpo\n');

// 1. Criar corrida
total++;
console.log('1️⃣  Criando corrida...');
const { data: ride, error: e1 } = await supabase
  .from('ride_requests')
  .insert({
    id: testRideId,
    passenger_profile_id: testPassengerId,
    driver_profile_id: testDriverId,
    origin: 'Origem Teste Motor',
    destination: 'Destino Teste Motor',
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
  console.log(`   Status: ${ride.status}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e1?.message}`);
}

// 2. Registrar auditoria da criação
total++;
console.log('\n2️⃣  Registrando auditoria da criação...');
const { data: audit1, error: e2 } = await supabase
  .from('ride_state_audit')
  .insert({
    ride_id: testRideId,
    from_state: 'none',
    to_state: 'requested',
    changed_by: 'system',
    reason: 'Corrida criada',
  })
  .select()
  .single();

if (!e2 && audit1) {
  console.log(`✅ Auditoria registrada: ${audit1.id}`);
  console.log(`   Transição: ${audit1.from_state} → ${audit1.to_state}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e2?.message}`);
}

// 3. Transicionar para searching_driver
total++;
console.log('\n3️⃣  Transicionando para searching_driver...');
const { data: updated1, error: e3 } = await supabase
  .from('ride_requests')
  .update({ status: 'searching_driver', updated_at: new Date().toISOString() })
  .eq('id', testRideId)
  .eq('status', 'requested')
  .select()
  .single();

if (!e3 && updated1) {
  console.log(`✅ Estado atualizado: ${updated1.status}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e3?.message}`);
}

// 4. Registrar auditoria da transição
total++;
console.log('\n4️⃣  Registrando auditoria da transição...');
const { data: audit2, error: e4 } = await supabase
  .from('ride_state_audit')
  .insert({
    ride_id: testRideId,
    from_state: 'requested',
    to_state: 'searching_driver',
    changed_by: 'system',
    reason: 'Busca automática',
  })
  .select()
  .single();

if (!e4 && audit2) {
  console.log(`✅ Auditoria registrada: ${audit2.id}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e4?.message}`);
}

// 5. Criar disponibilidade do motorista
total++;
console.log('\n5️⃣  Criando disponibilidade do motorista...');
const { data: avail1, error: e5 } = await supabase
  .from('driver_availability')
  .upsert({
    profile_id: testDriverId,
    is_online: true,
    is_available: true,
    current_lat: -20.3155,
    current_lng: -40.3128,
  })
  .select()
  .single();

if (!e5 && avail1) {
  console.log(`✅ Motorista disponível: ${avail1.profile_id.substring(0, 8)}...`);
  console.log(`   Online: ${avail1.is_online}, Disponível: ${avail1.is_available}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e5?.message}`);
}

// 6. Atribuir motorista
total++;
console.log('\n6️⃣  Atribuindo motorista...');
const { data: updated2, error: e6 } = await supabase
  .from('ride_requests')
  .update({ status: 'driver_assigned', updated_at: new Date().toISOString() })
  .eq('id', testRideId)
  .eq('status', 'searching_driver')
  .select()
  .single();

if (!e6 && updated2) {
  console.log(`✅ Motorista atribuído: ${updated2.status}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e6?.message}`);
}

// 7. Aceitar corrida (optimistic locking)
total++;
console.log('\n7️⃣  Aceitando corrida (optimistic locking)...');
const { data: updated3, error: e7 } = await supabase
  .from('ride_requests')
  .update({ status: 'driver_accepted', updated_at: new Date().toISOString() })
  .eq('id', testRideId)
  .eq('status', 'driver_assigned')
  .eq('driver_profile_id', testDriverId)
  .select()
  .single();

if (!e7 && updated3) {
  console.log(`✅ Corrida aceita: ${updated3.status}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e7?.message}`);
}

// 8. Tentar aceitar novamente (deve falhar)
total++;
console.log('\n8️⃣  Tentando aceitar novamente (deve falhar)...');
const { data: duplicate, error: e8 } = await supabase
  .from('ride_requests')
  .update({ status: 'driver_accepted', updated_at: new Date().toISOString() })
  .eq('id', testRideId)
  .eq('status', 'driver_assigned')
  .eq('driver_profile_id', testDriverId)
  .select();

if (e8 || !duplicate || duplicate.length === 0) {
  console.log('✅ Aceite duplicado bloqueado (optimistic locking funcionou)');
  passed++;
} else {
  console.log('❌ FALHA: Aceite duplicado permitido!');
}

// 9. Marcar motorista como indisponível
total++;
console.log('\n9️⃣  Marcando motorista como indisponível...');
const { data: avail2, error: e9 } = await supabase
  .from('driver_availability')
  .update({ is_available: false, updated_at: new Date().toISOString() })
  .eq('profile_id', testDriverId)
  .select()
  .single();

if (!e9 && avail2) {
  console.log(`✅ Motorista indisponível: ${!avail2.is_available}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e9?.message}`);
}

// 10. Completar corrida
total++;
console.log('\n🔟 Completando corrida...');
const { data: updated4, error: e10 } = await supabase
  .from('ride_requests')
  .update({ status: 'completed', updated_at: new Date().toISOString() })
  .eq('id', testRideId)
  .select()
  .single();

if (!e10 && updated4) {
  console.log(`✅ Corrida completada: ${updated4.status}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e10?.message}`);
}

// 11. Liberar motorista
total++;
console.log('\n1️⃣1️⃣  Liberando motorista...');
const { data: avail3, error: e11 } = await supabase
  .from('driver_availability')
  .update({ is_available: true, updated_at: new Date().toISOString() })
  .eq('profile_id', testDriverId)
  .select()
  .single();

if (!e11 && avail3) {
  console.log(`✅ Motorista liberado: ${avail3.is_available}`);
  passed++;
} else {
  console.log(`❌ Erro: ${e11?.message}`);
}

// 12. Verificar auditoria completa
total++;
console.log('\n1️⃣2️⃣  Verificando auditoria completa...');
const { data: auditFinal, error: e12 } = await supabase
  .from('ride_state_audit')
  .select('*')
  .eq('ride_id', testRideId)
  .order('created_at', { ascending: true });

if (!e12 && auditFinal && auditFinal.length > 0) {
  console.log(`✅ Auditoria completa: ${auditFinal.length} registro(s)`);
  auditFinal.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.from_state} → ${a.to_state} (${a.changed_by})`);
  });
  passed++;
} else {
  console.log(`❌ Erro: ${e12?.message || 'Nenhum registro'}`);
}

// Limpeza final
console.log('\n🧹 Limpando dados de teste...');
await supabase.from('ride_state_audit').delete().eq('ride_id', testRideId);
await supabase.from('ride_requests').delete().eq('id', testRideId);
await supabase.from('driver_availability').delete().eq('profile_id', testDriverId);

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);

if (passed === total) {
  console.log('🎉 MOTOR OPERACIONAL: VALIDADO!\n');
  console.log('✅ FK funcionando (auditoria aceita ride_requests)');
  console.log('✅ Criação de corrida');
  console.log('✅ Transições de estado');
  console.log('✅ Auditoria funcionando');
  console.log('✅ Disponibilidade funcionando');
  console.log('✅ Optimistic locking funcionando');
  console.log('✅ Fluxo completo validado\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${total - passed} teste(s) falharam\n`);
  process.exit(1);
}
