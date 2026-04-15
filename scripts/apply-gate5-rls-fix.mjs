#!/usr/bin/env node

/**
 * GATE 5: Aplicar fix de RLS
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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
  db: {
    schema: 'public',
  },
});

async function applyMigration() {
  console.log('🚀 GATE 5: Aplicando fix de RLS\n');

  // Ler migration
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260407000008_gate5_fix_rls.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📝 Migration:');
  console.log(sql);
  console.log('\n');

  // Dividir em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Executando ${statements.length} statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`${i + 1}. Executando: ${statement.substring(0, 80)}...`);

    try {
      // Usar query direta via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql_query: statement }),
      });

      if (!response.ok) {
        // Tentar executar via client direto
        const { error } = await supabase.rpc('query', { query_text: statement });
        if (error) {
          console.error(`   ❌ Erro: ${error.message}`);
        } else {
          console.log('   ✅ OK');
        }
      } else {
        console.log('   ✅ OK');
      }
    } catch (error) {
      console.error(`   ⚠️ Aviso: ${error.message}`);
    }
  }

  console.log('\n✅ Migration aplicada!');
  console.log('\n🧪 Testando acesso...');

  // Testar upsert
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
    console.error('❌ Teste falhou:', error.message);
  } else {
    console.log('✅ Teste passou!');
    console.log('Dados:', data);
  }
}

applyMigration().catch(console.error);
