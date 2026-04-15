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

console.log('Verificando RLS policies...\n');

// Pular verificação de policies (pg_policies não é acessível via REST API)
console.log('(Pulando verificação de policies - não acessível via REST API)\n');

console.log('Testando inserção com service_role...');

const testProfileId = '00000000-0000-0000-0000-000000000099';

// Primeiro, verificar qual role estamos usando
console.log('Verificando role atual...');
const { data: roleData, error: roleError } = await supabase.rpc('current_user');
if (roleError) {
  console.log('Não foi possível verificar role:', roleError.message);
} else {
  console.log('Role atual:', roleData);
}

console.log('');

const { data, error: insertError } = await supabase
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

if (insertError) {
  console.error('❌ Falhou:', insertError.message);
  console.error('Código:', insertError.code);
  console.error('Detalhes:', insertError.details);
} else {
  console.log('✅ Sucesso!');
  console.log('Dados:', data);
}

// Limpar
await supabase
  .from('driver_availability')
  .delete()
  .eq('profile_id', testProfileId);
