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

console.log('Testando goOnline...\n');

const testProfileId = '2357467c-4f5e-4285-bf6b-39628c6a44ad';

const { data, error } = await supabase
  .from('driver_availability')
  .upsert({
    profile_id: testProfileId,
    is_online: true,
    is_available: false,
    active_ride_id: null,
    busy_since: null,
    active_ride_mode: null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'profile_id',
  })
  .select();

if (error) {
  console.error('Erro:');
  console.error('  Message:', error.message);
  console.error('  Code:', error.code);
  console.error('  Details:', error.details);
  console.error('  Hint:', error.hint);
  console.error('\nErro completo:', JSON.stringify(error, null, 2));
} else {
  console.log('Sucesso!');
  console.log('Dados:', data);
}
