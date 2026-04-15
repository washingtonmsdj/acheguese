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

console.log('Testando constraint check_available_requirements...\n');

const testProfileId = '2357467c-4f5e-4285-bf6b-39628c6a44ad';

// Teste 1: Tentar criar com is_available=true mas sem coordenadas (deve falhar)
console.log('Teste 1: is_available=true sem coordenadas (deve falhar)');
const { data: test1, error: error1 } = await supabase
  .from('driver_availability')
  .upsert({
    profile_id: testProfileId,
    is_online: true,
    is_available: true, // TRUE
    current_lat: null,  // NULL - viola constraint
    current_lng: null,  // NULL - viola constraint
    active_ride_id: null,
    busy_since: null,
    active_ride_mode: null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'profile_id',
  })
  .select();

if (error1) {
  console.log('✅ Falhou como esperado:', error1.message);
} else {
  console.log('❌ Deveria ter falhado mas passou!', test1);
}

console.log('');

// Teste 2: Criar com is_available=false (deve passar)
console.log('Teste 2: is_available=false (deve passar)');
const { data: test2, error: error2 } = await supabase
  .from('driver_availability')
  .upsert({
    profile_id: testProfileId,
    is_online: true,
    is_available: false, // FALSE - OK sem coordenadas
    current_lat: null,
    current_lng: null,
    active_ride_id: null,
    busy_since: null,
    active_ride_mode: null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'profile_id',
  })
  .select();

if (error2) {
  console.log('❌ Falhou mas deveria passar:', error2.message);
} else {
  console.log('✅ Passou como esperado!');
}

console.log('');

// Teste 3: Atualizar para is_available=true COM coordenadas (deve passar)
console.log('Teste 3: is_available=true COM coordenadas (deve passar)');
const { data: test3, error: error3 } = await supabase
  .from('driver_availability')
  .update({
    is_available: true,
    current_lat: -23.5505,
    current_lng: -46.6333,
  })
  .eq('profile_id', testProfileId)
  .select();

if (error3) {
  console.log('❌ Falhou mas deveria passar:', error3.message);
} else {
  console.log('✅ Passou como esperado!');
}
