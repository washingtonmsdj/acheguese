/**
 * Script: Verificar schema de tabelas vazias
 * user_residences e ride_requests aparecem com 0 colunas no snapshot
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = resolve(process.cwd(), '.env.remote');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function verifyEmptyTables() {
  console.log('🔍 Verificando schema de tabelas vazias\n');

  // Tentar INSERT para ver quais colunas são obrigatórias
  console.log('1️⃣ user_residences - Testando INSERT para ver schema...');
  const { error: error1 } = await supabase
    .from('user_residences')
    .insert({ user_id: '00000000-0000-0000-0000-000000000000' });

  console.log('Erro esperado:', error1?.message);
  console.log('Detalhes:', error1?.details);

  console.log('\n2️⃣ ride_requests - Testando INSERT para ver schema...');
  const { error: error2 } = await supabase
    .from('ride_requests')
    .insert({ passenger_profile_id: '00000000-0000-0000-0000-000000000000' });

  console.log('Erro esperado:', error2?.message);
  console.log('Detalhes:', error2?.details);

  console.log('\n3️⃣ addresses - Testando INSERT para ver schema...');
  const { error: error3 } = await supabase
    .from('addresses')
    .insert({ location_id: '00000000-0000-0000-0000-000000000000' });

  console.log('Erro esperado:', error3?.message);
  console.log('Detalhes:', error3?.details);
}

verifyEmptyTables().catch(console.error);
