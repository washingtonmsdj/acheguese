#!/usr/bin/env node
/**
 * Fix ad_targets table structure
 * Dropa e recria a tabela com a estrutura correta (location_id + target_scope)
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Carrega .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

async function main() {
  console.log('🔧 Corrigindo estrutura da tabela ad_targets...\n');

  // 1. Drop da tabela antiga
  console.log('1️⃣ Dropando tabela ad_targets antiga...');
  const { error: dropError } = await supabase.rpc('exec_sql', {
    query: 'DROP TABLE IF EXISTS ad_targets CASCADE;'
  });

  if (dropError) {
    console.error('❌ Erro ao dropar:', dropError);
    // Tenta via query direta
    const { error: dropError2 } = await supabase
      .from('_sql')
      .select()
      .eq('query', 'DROP TABLE IF EXISTS ad_targets CASCADE;');
    
    if (dropError2) {
      console.log('⚠️ Não foi possível dropar via RPC, tentando recriar diretamente...');
    }
  } else {
    console.log('✅ Tabela dropada\n');
  }

  // 2. Recriar com estrutura correta
  console.log('2️⃣ Recriando tabela com estrutura correta...');
  const migration = readFileSync('supabase/migrations/20260326000003_create_ad_targets.sql', 'utf-8');
  
  // Divide em statements individuais
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });
      
      if (error) {
        console.error(`❌ Erro no statement: ${statement.substring(0, 50)}...`);
        console.error(error);
      }
    } catch (err) {
      console.error(`❌ Erro ao executar: ${err.message}`);
    }
  }

  console.log('\n✅ Processo concluído!');
  console.log('⚠️ Verifique manualmente se a tabela foi criada corretamente.');
}

main().catch(console.error);
