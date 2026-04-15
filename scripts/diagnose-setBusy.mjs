#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔍 DIAGNÓSTICO: setBusy() e releaseBusy()\n');

const testProfileId = '2357467c-4f5e-4285-bf6b-39628c6a44ad';
const testRideId = '00000000-0000-0000-0000-000000000101';

// Preparar: garantir que está online_available
console.log('PREPARAÇÃO: Colocar motorista em online_available');
await supabase
  .from('driver_availability')
  .upsert({
    profile_id: testProfileId,
    is_online: true,
    is_available: true,
    current_lat: -23.5505,
    current_lng: -46.6333,
    active_ride_id: null,
    busy_since: null,
    active_ride_mode: null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'profile_id',
  });

const { data: prep } = await supabase
  .from('driver_availability')
  .select('*')
  .eq('profile_id', testProfileId)
  .single();

console.log('Estado inicial:');
console.log('  - is_online:', prep.is_online);
console.log('  - is_available:', prep.is_available);
console.log('  - active_ride_id:', prep.active_ride_id);
console.log('  - busy_since:', prep.busy_since);
console.log('  - active_ride_mode:', prep.active_ride_mode);
console.log('');

// Teste 1: setBusy()
console.log('═'.repeat(60));
console.log('TESTE 1: setBusy() - online_available → busy');
console.log('═'.repeat(60));

const setBusyPayload = {
  is_available: false,
  active_ride_id: testRideId,
  busy_since: new Date().toISOString(),
  active_ride_mode: 'ride',
  updated_at: new Date().toISOString(),
};

console.log('Payload:');
console.log(JSON.stringify(setBusyPayload, null, 2));
console.log('');

const { data: busyResult, error: busyError } = await supabase
  .from('driver_availability')
  .update(setBusyPayload)
  .eq('profile_id', testProfileId)
  .eq('is_online', true)
  .eq('is_available', true)
  .is('active_ride_id', null)
  .select();

if (busyError) {
  console.log('❌ FALHOU:', busyError.message);
} else if (!busyResult || busyResult.length === 0) {
  console.log('❌ FALHOU: Nenhuma linha atualizada (condições não satisfeitas)');
} else {
  console.log('✅ SUCESSO');
  const after = busyResult[0];
  console.log('Estado após setBusy:');
  console.log('  - is_online:', after.is_online);
  console.log('  - is_available:', after.is_available);
  console.log('  - active_ride_id:', after.active_ride_id);
  console.log('  - busy_since:', after.busy_since);
  console.log('  - active_ride_mode:', after.active_ride_mode);
  
  // Calcular status
  const status = after.is_online
    ? after.is_available
      ? 'online_available'
      : after.active_ride_id
        ? 'busy'
        : 'online_warming_up'
    : 'offline';
  
  console.log('  - Status calculado:', status);
  console.log('  - Esperado: busy');
  console.log('  - Match:', status === 'busy' ? '✅' : '❌');
}

console.log('');

// Teste 2: releaseBusy()
console.log('═'.repeat(60));
console.log('TESTE 2: releaseBusy() - busy → online_available');
console.log('═'.repeat(60));

const releaseBusyPayload = {
  is_available: true,
  active_ride_id: null,
  busy_since: null,
  active_ride_mode: null,
  updated_at: new Date().toISOString(),
};

console.log('Payload:');
console.log(JSON.stringify(releaseBusyPayload, null, 2));
console.log('');

const { data: releaseResult, error: releaseError } = await supabase
  .from('driver_availability')
  .update(releaseBusyPayload)
  .eq('profile_id', testProfileId)
  .eq('is_online', true)
  .eq('active_ride_id', testRideId)
  .select();

if (releaseError) {
  console.log('❌ FALHOU:', releaseError.message);
} else if (!releaseResult || releaseResult.length === 0) {
  console.log('❌ FALHOU: Nenhuma linha atualizada (condições não satisfeitas)');
} else {
  console.log('✅ SUCESSO');
  const after = releaseResult[0];
  console.log('Estado após releaseBusy:');
  console.log('  - is_online:', after.is_online);
  console.log('  - is_available:', after.is_available);
  console.log('  - active_ride_id:', after.active_ride_id);
  console.log('  - busy_since:', after.busy_since);
  console.log('  - active_ride_mode:', after.active_ride_mode);
  
  // Calcular status
  const status = after.is_online
    ? after.is_available
      ? 'online_available'
      : after.active_ride_id
        ? 'busy'
        : 'online_warming_up'
    : 'offline';
  
  console.log('  - Status calculado:', status);
  console.log('  - Esperado: online_available');
  console.log('  - Match:', status === 'online_available' ? '✅' : '❌');
}

console.log('');
console.log('═'.repeat(60));
