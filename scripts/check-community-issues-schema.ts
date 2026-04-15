/**
 * Script: Verificar schema e dados de community_issues
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Carregar .env.remote
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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function checkSchema() {
  console.log('🔍 Verificando schema e dados de community_issues\n');

  // 1. Verificar se a tabela existe e tem dados
  console.log('1️⃣ Verificando dados na tabela...');
  const { data: issues, error: error1 } = await supabase
    .from('community_issues')
    .select('*')
    .limit(5);

  if (error1) {
    console.error('❌ Erro ao buscar issues:', error1);
  } else {
    console.log(`✅ Tabela existe: ${issues?.length ?? 0} registros`);
    if (issues && issues.length > 0) {
      console.log('   Exemplo:', JSON.stringify(issues[0], null, 2));
    }
  }

  // 2. Verificar se locations existe
  console.log('\n2️⃣ Verificando tabela locations...');
  const { data: locations, error: error2 } = await supabase
    .from('locations')
    .select('id, city, neighborhood')
    .limit(5);

  if (error2) {
    console.error('❌ Erro ao buscar locations:', error2);
  } else {
    console.log(`✅ Tabela locations existe: ${locations?.length ?? 0} registros`);
    if (locations && locations.length > 0) {
      console.log('   Exemplo:', JSON.stringify(locations[0], null, 2));
    }
  }

  // 3. Tentar query com JOIN usando sintaxe alternativa
  console.log('\n3️⃣ Testando JOIN alternativo...');
  const { data: joined, error: error3 } = await supabase
    .from('community_issues')
    .select('*, locations(city, neighborhood)')
    .limit(5);

  if (error3) {
    console.error('❌ Erro no JOIN:', error3);
  } else {
    console.log(`✅ JOIN OK: ${joined?.length ?? 0} registros`);
    if (joined && joined.length > 0) {
      console.log('   Exemplo:', JSON.stringify(joined[0], null, 2));
    }
  }

  console.log('\n✅ Verificação concluída');
}

checkSchema().catch(console.error);
