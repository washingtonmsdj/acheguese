#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('✅ VALIDAÇÃO DAS TABELAS DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

// 1. Verificar ride_state_audit
total++;
const { data: t1, error: e1 } = await supabase.from('ride_state_audit').select('id').limit(1);
if (!e1) {
  console.log('✅ ride_state_audit: EXISTE');
  passed++;
} else {
  console.log('❌ ride_state_audit:', e1.message);
}

// 2. Verificar driver_availability
total++;
const { data: t2, error: e2 } = await supabase.from('driver_availability').select('profile_id').limit(1);
if (!e2) {
  console.log('✅ driver_availability: EXISTE');
  passed++;
} else {
  console.log('❌ driver_availability:', e2.message);
}

// 3. Inserir em driver_availability
total++;
const testProfileId = '00000000-0000-0000-0000-000000000001';
const { error: e3 } = await supabase.from('driver_availability').upsert({
  profile_id: testProfileId,
  is_online: true,
  is_available: true,
  current_lat: -20.3155,
  current_lng: -40.3128,
});
if (!e3) {
  console.log('✅ driver_availability: INSERT/UPDATE funciona');
  passed++;
} else {
  console.log('❌ driver_availability INSERT:', e3.message);
}

// 4. Buscar motoristas disponíveis
total++;
const { data: drivers, error: e4 } = await supabase
  .from('driver_availability')
  .select('*')
  .eq('is_online', true)
  .eq('is_available', true);
if (!e4) {
  console.log(`✅ driver_availability: SELECT funciona (${drivers.length} registro(s))`);
  passed++;
} else {
  console.log('❌ driver_availability SELECT:', e4.message);
}

// 5. Inserir em ride_state_audit
total++;
const testRideId = '00000000-0000-0000-0000-000000000002';
const { error: e5 } = await supabase.from('ride_state_audit').insert({
  ride_id: testRideId,
  from_state: 'requested',
  to_state: 'searching_driver',
  changed_by: 'system',
  reason: 'Teste de validação',
});
if (!e5) {
  console.log('✅ ride_state_audit: INSERT funciona');
  passed++;
} else {
  console.log('❌ ride_state_audit INSERT:', e5.message);
}

// 6. Buscar auditoria
total++;
const { data: audit, error: e6 } = await supabase
  .from('ride_state_audit')
  .select('*')
  .eq('ride_id', testRideId);
if (!e6 && audit && audit.length > 0) {
  console.log(`✅ ride_state_audit: SELECT funciona (${audit.length} registro(s))`);
  passed++;
} else {
  console.log('❌ ride_state_audit SELECT:', e6?.message || 'Nenhum registro');
}

// Limpeza
await supabase.from('driver_availability').delete().eq('profile_id', testProfileId);
await supabase.from('ride_state_audit').delete().eq('ride_id', testRideId);

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);

if (passed === total) {
  console.log('🎉 MOTOR OPERACIONAL: TABELAS VALIDADAS!\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${total - passed} teste(s) falharam\n`);
  process.exit(1);
}
