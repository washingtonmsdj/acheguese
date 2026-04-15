#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 CORRIGINDO FOREIGN KEY DE ride_state_audit\n');

// 1. Verificar constraint atual
console.log('1️⃣  Verificando constraint atual...');
const { data: currentConstraint, error: e1 } = await supabase
  .from('ride_state_audit')
  .select('ride_id')
  .limit(1);

if (e1) {
  console.log('❌ Erro ao acessar tabela:', e1.message);
} else {
  console.log('✅ Tabela acessível');
}

// 2. Tentar inserir com ride_id de ride_requests
console.log('\n2️⃣  Testando insert com ride_id de ride_requests...');

// Primeiro, criar uma corrida de teste
const testPassengerId = '00000000-0000-0000-0000-000000000001';
const testDriverId = '00000000-0000-0000-0000-000000000002';

const { data: testRide, error: e2 } = await supabase
  .from('ride_requests')
  .insert({
    passenger_profile_id: testPassengerId,
    driver_profile_id: testDriverId,
    origin: 'Teste FK',
    destination: 'Teste FK',
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

if (e2) {
  console.log('❌ Erro ao criar corrida de teste:', e2.message);
  process.exit(1);
}

console.log(`✅ Corrida de teste criada: ${testRide.id}`);

// Tentar inserir auditoria
console.log('\n3️⃣  Inserindo auditoria...');
const { data: audit, error: e3 } = await supabase
  .from('ride_state_audit')
  .insert({
    ride_id: testRide.id,
    from_state: 'requested',
    to_state: 'searching_driver',
    changed_by: 'system',
    reason: 'Teste FK',
  })
  .select()
  .single();

if (e3) {
  console.log('❌ Erro ao inserir auditoria:', e3.message);
  console.log('\n⚠️  FK PRECISA SER CORRIGIDA MANUALMENTE VIA SQL EDITOR');
  console.log('   Arquivo: FIX_RIDE_STATE_AUDIT_REFERENCE.sql');
} else {
  console.log('✅ Auditoria inserida com sucesso!');
  console.log(`   ID: ${audit.id}`);
  console.log(`   Transição: ${audit.from_state} → ${audit.to_state}`);
  console.log('\n✅ FK ESTÁ CORRETA!');
}

// Limpeza
console.log('\n🧹 Limpando dados de teste...');
await supabase.from('ride_state_audit').delete().eq('ride_id', testRide.id);
await supabase.from('ride_requests').delete().eq('id', testRide.id);

console.log('\n✅ CONCLUÍDO!\n');
