#!/usr/bin/env node

/**
 * GATE 5: DIAGNÓSTICO - Verificar se migration foi aplicada
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

async function checkMigration() {
  console.log('🔍 GATE 5: Diagnóstico da Migration\n');

  // 1. Verificar se tabela existe
  console.log('1. Verificando se tabela driver_availability existe...');
  const { data: tables, error: tablesError } = await supabase
    .from('driver_availability')
    .select('*')
    .limit(1);

  if (tablesError) {
    console.error('❌ Tabela não existe ou erro ao acessar:', tablesError.message);
    return;
  }

  console.log('✅ Tabela existe\n');

  // 2. Verificar estrutura da tabela (tentar inserir e ver erro)
  console.log('2. Verificando campos da tabela...');
  const testProfileId = '00000000-0000-0000-0000-000000000099';
  
  const { data: insertData, error: insertError } = await supabase
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
    console.error('❌ Erro ao fazer upsert:', insertError.message);
    console.error('Código:', insertError.code);
    console.error('Detalhes:', insertError.details);
    console.error('Hint:', insertError.hint);
    return;
  }

  console.log('✅ Upsert funcionou!');
  console.log('Dados inseridos:', insertData);

  // Limpar teste
  await supabase
    .from('driver_availability')
    .delete()
    .eq('profile_id', testProfileId);

  console.log('\n✅ Migration do Gate 5 está aplicada corretamente!');
}

checkMigration().catch(console.error);
