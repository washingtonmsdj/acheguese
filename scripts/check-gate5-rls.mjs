#!/usr/bin/env node

/**
 * GATE 5: DIAGNÓSTICO - Verificar RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: variáveis de ambiente não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkRLS() {
  console.log('🔍 GATE 5: Diagnóstico de RLS\n');

  // Verificar policies
  console.log('1. Verificando RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', {
      sql_query: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'driver_availability'
        ORDER BY policyname;
      `
    });

  if (policiesError) {
    console.error('❌ Erro ao buscar policies:', policiesError.message);
    
    // Tentar query alternativa
    console.log('\n2. Tentando query alternativa...');
    const { data: rls, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT relname, relrowsecurity 
          FROM pg_class 
          WHERE relname = 'driver_availability';
        `
      });
    
    if (rlsError) {
      console.error('❌ Erro na query alternativa:', rlsError.message);
    } else {
      console.log('RLS status:', rls);
    }
    return;
  }

  if (!policies || policies.length === 0) {
    console.log('⚠️ Nenhuma policy encontrada para driver_availability');
  } else {
    console.log(`✅ Encontradas ${policies.length} policies:\n`);
    policies.forEach((policy, index) => {
      console.log(`Policy ${index + 1}: ${policy.policyname}`);
      console.log(`  Comando: ${policy.cmd}`);
      console.log(`  Roles: ${policy.roles}`);
      console.log(`  Qual: ${policy.qual}`);
      console.log(`  With Check: ${policy.with_check}`);
      console.log('');
    });
  }

  // Testar upsert com perfil real
  console.log('3. Testando upsert com perfil real...');
  const testProfileId = '2357467c-4f5e-4285-bf6b-39628c6a44ad';
  
  const { data: upsertData, error: upsertError } = await supabase
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

  if (upsertError) {
    console.error('❌ Erro ao fazer upsert:', upsertError.message);
    console.error('Código:', upsertError.code);
    console.error('Detalhes:', upsertError.details);
  } else {
    console.log('✅ Upsert com perfil real funcionou!');
    console.log('Dados:', upsertData);
  }
}

checkRLS().catch(console.error);
