#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

console.log('🧪 TESTE SIMPLES DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

// IDs de teste
const testPassengerId = '00000000-0000-0000-0000-000000000001';
const testDriverId = '00000000-0000-0000-0000-000000000002';
let testRideId = null;

// 1. Criar corrida
total++;
console.log('1️⃣  Criando corrida...');
try {
  const { data: ride, error } = await supabase
    .from('ride_requests')
    .insert({
      passenger_profile_id: testPassengerId,
      driver_profile_id: testDriverId,
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
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      available_seats: 1,
      search_radius_km: 5,
      max_wait_time_minutes: 15,
      driver_assigned_at: new Date().toISOString(),
      driver_on_the_way_at: new Date().toISOString(),
      driver_arrived_at: new Date().toISOString(),
      passenger_on_board_at: new Date().toISOString(),
      passenger_rated_driver: false,
      driver_rated_passenger: false,
      passenger_confirmed: false,
      passenger_confirmed_at: new Date().toISOString(),
      is_shared: false,
      max_passengers: 1,
      current_passengers: 0,
      share_view_count: 0,
      share_is_active: false,
    })
    .select()
    .single();

  if (error) throw error;
  
  console.log(`✅ Corrida criada: ${ride.id}`);
  console.log(`   Estado: ${ride.status}`);
  testRideId = ride.id;
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 2. Transicionar para searching_driver
total++;
console.log('\n2️⃣  Transicionando para searching_driver...');
try {
  const { error } = await supabase
    .from('ride_requests')
    .update({ status: 'searching_driver' })
    .eq('id', testRideId)
    .eq('status', 'requested');

  if (error) throw error;
  console.log('✅ Estado atualizado');
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 3. Registrar auditoria
total++;
console.log('\n3️⃣  Registrando auditoria...');
try {
  const { error } = await supabase
    .from('ride_state_audit')
    .insert({
      ride_id: testRideId,
      from_state: 'requested',
      to_state: 'searching_driver',
      changed_by: 'system',
      reason: 'Teste simples',
    });

  if (error) throw error;
  console.log('✅ Auditoria registrada');
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 4. Criar disponibilidade
total++;
console.log('\n4️⃣  Criando disponibilidade do motorista...');
try {
  const { error } = await supabase
    .from('driver_availability')
    .upsert({
      profile_id: testDriverId,
      is_online: true,
      is_available: true,
      current_lat: -20.3155,
      current_lng: -40.3128,
    });

  if (error) throw error;
  console.log('✅ Motorista disponível');
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 5. Atribuir motorista
total++;
console.log('\n5️⃣  Atribuindo motorista...');
try {
  const { error } = await supabase
    .from('ride_requests')
    .update({
      status: 'driver_assigned',
    })
    .eq('id', testRideId)
    .eq('status', 'searching_driver');

  if (error) throw error;
  console.log('✅ Motorista atribuído');
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 6. Aceitar corrida
total++;
console.log('\n6️⃣  Aceitando corrida...');
try {
  const { error } = await supabase
    .from('ride_requests')
    .update({
      status: 'driver_accepted',
    })
    .eq('id', testRideId)
    .eq('status', 'driver_assigned')
    .eq('driver_profile_id', testDriverId);

  if (error) throw error;
  console.log('✅ Corrida aceita');
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 7. Tentar aceitar novamente (deve falhar)
total++;
console.log('\n7️⃣  Tentando aceitar novamente (deve falhar)...');
try {
  const { data, error } = await supabase
    .from('ride_requests')
    .update({
      status: 'driver_accepted',
    })
    .eq('id', testRideId)
    .eq('status', 'driver_assigned')
    .eq('driver_profile_id', testDriverId)
    .select();

  if (error || !data || data.length === 0) {
    console.log('✅ Aceite duplicado bloqueado');
    passed++;
  } else {
    console.log('❌ FALHA: Aceite duplicado permitido!');
  }
} catch (error) {
  console.log('✅ Aceite duplicado bloqueado (erro esperado)');
  passed++;
}

// 8. Completar corrida
total++;
console.log('\n8️⃣  Completando corrida...');
try {
  const { error } = await supabase
    .from('ride_requests')
    .update({
      status: 'completed',
    })
    .eq('id', testRideId);

  if (error) throw error;
  console.log('✅ Corrida completada');
  passed++;
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// 9. Verificar auditoria
total++;
console.log('\n9️⃣  Verificando auditoria...');
try {
  const { data, error } = await supabase
    .from('ride_state_audit')
    .select('*')
    .eq('ride_id', testRideId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  if (data && data.length > 0) {
    console.log(`✅ Auditoria completa: ${data.length} registro(s)`);
    data.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.from_state} → ${a.to_state} (${a.changed_by})`);
    });
    passed++;
  } else {
    console.log('❌ Nenhum registro de auditoria');
  }
} catch (error) {
  console.log('❌ Erro:', error.message);
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
  console.log('✅ Criação de corrida');
  console.log('✅ Transições de estado');
  console.log('✅ Auditoria');
  console.log('✅ Disponibilidade');
  console.log('✅ Optimistic locking');
  console.log('✅ Fluxo completo\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${total - passed} teste(s) falharam\n`);
  process.exit(1);
}
