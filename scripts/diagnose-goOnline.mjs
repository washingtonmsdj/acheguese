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

console.log('🔍 DIAGNÓSTICO: goOnline()\n');

const testProfileId = '2357467c-4f5e-4285-bf6b-39628c6a44ad';

// 1. Estado ANTES
console.log('1. Estado ANTES do goOnline():');
const { data: before, error: beforeError } = await supabase
  .from('driver_availability')
  .select('*')
  .eq('profile_id', testProfileId)
  .maybeSingle();

if (beforeError) {
  console.log('   Erro ao buscar:', beforeError.message);
} else if (!before) {
  console.log('   ⚠️ Registro não existe (será criado)');
} else {
  console.log('   Registro existe:');
  console.log('   - is_online:', before.is_online);
  console.log('   - is_available:', before.is_available);
  console.log('   - current_lat:', before.current_lat);
  console.log('   - current_lng:', before.current_lng);
  console.log('   - active_ride_id:', before.active_ride_id);
  console.log('   - busy_since:', before.busy_since);
  console.log('   - active_ride_mode:', before.active_ride_mode);
  console.log('   - last_seen_at:', before.last_seen_at);
}

console.log('');

// 2. Executar goOnline()
console.log('2. Executando goOnline()...');

const payload = {
  profile_id: testProfileId,
  is_online: true,
  is_available: false,
  active_ride_id: null,
  busy_since: null,
  active_ride_mode: null,
  last_seen_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

console.log('   Payload:');
console.log('   ', JSON.stringify(payload, null, 2).split('\n').join('\n    '));

const { data: result, error: upsertError } = await supabase
  .from('driver_availability')
  .upsert(payload, {
    onConflict: 'profile_id',
  })
  .select();

console.log('');

if (upsertError) {
  console.log('   ❌ FALHOU');
  console.log('   Erro:', upsertError.message);
  console.log('   Código:', upsertError.code);
  console.log('   Detalhes:', upsertError.details);
  console.log('   Hint:', upsertError.hint);
} else {
  console.log('   ✅ SUCESSO');
  console.log('   Resultado:', result);
}

console.log('');

// 3. Estado DEPOIS
console.log('3. Estado DEPOIS do goOnline():');
const { data: after, error: afterError } = await supabase
  .from('driver_availability')
  .select('*')
  .eq('profile_id', testProfileId)
  .maybeSingle();

if (afterError) {
  console.log('   Erro ao buscar:', afterError.message);
} else if (!after) {
  console.log('   ⚠️ Registro não existe (não foi criado)');
} else {
  console.log('   Registro:');
  console.log('   - is_online:', after.is_online);
  console.log('   - is_available:', after.is_available);
  console.log('   - current_lat:', after.current_lat);
  console.log('   - current_lng:', after.current_lng);
  console.log('   - active_ride_id:', after.active_ride_id);
  console.log('   - busy_since:', after.busy_since);
  console.log('   - active_ride_mode:', after.active_ride_mode);
  console.log('   - last_seen_at:', after.last_seen_at);
}

console.log('');

// 4. Calcular status conceitual
console.log('4. Status conceitual calculado:');
if (after) {
  const status = after.is_online
    ? after.is_available
      ? 'online_available'
      : after.active_ride_id
        ? 'busy'
        : 'online_warming_up'
    : 'offline';
  
  console.log('   Status:', status);
  console.log('   Esperado: online_warming_up');
  console.log('   Match:', status === 'online_warming_up' ? '✅' : '❌');
}

console.log('');
console.log('═'.repeat(60));
