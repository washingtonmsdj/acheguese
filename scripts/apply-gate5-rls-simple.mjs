#!/usr/bin/env node

/**
 * GATE 5: Aplicar RLS Fix - Método Simples
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

console.log('🚀 GATE 5: Aplicando RLS Fix\n');
console.log(`📍 URL: ${supabaseUrl}\n`);

// Statements SQL
const statements = [
  'ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY',
  'DROP POLICY IF EXISTS "Service role full access" ON driver_availability',
  'DROP POLICY IF EXISTS "Drivers can manage own availability" ON driver_availability',
  'DROP POLICY IF EXISTS "Public can read online drivers" ON driver_availability',
  `CREATE POLICY "Service role full access" ON driver_availability FOR ALL TO service_role USING (true) WITH CHECK (true)`,
  `CREATE POLICY "Drivers can manage own availability" ON driver_availability FOR ALL TO authenticated USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver')) WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'))`,
  `CREATE POLICY "Public can read online drivers" ON driver_availability FOR SELECT TO authenticated USING (is_online = true)`,
];

async function executeStatement(sql, index, total) {
  const preview = sql.substring(0, 80).replace(/\s+/g, ' ');
  console.log(`${index + 1}/${total}. ${preview}...`);

  try {
    // Usar fetch direto para API REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (response.ok) {
      console.log('   ✅ OK\n');
      return { success: true };
    } else {
      const error = await response.text();
      console.log(`   ⚠️ Resposta: ${response.status} - ${error.substring(0, 100)}\n`);
      return { success: false, error };
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('📊 Executando statements...\n');

  const results = [];

  for (let i = 0; i < statements.length; i++) {
    const result = await executeStatement(statements[i], i, statements.length);
    results.push(result);
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('─'.repeat(60));
  console.log('📊 Resumo:');
  console.log(`  ✅ Sucesso: ${successCount}/${statements.length}`);
  console.log(`  ❌ Falhas: ${failCount}/${statements.length}`);
  console.log('─'.repeat(60));

  if (failCount === statements.length) {
    console.log('\n⚠️ Todas as operações falharam.');
    console.log('Isso pode significar que a função exec_sql não existe.');
    console.log('\n📝 Solução alternativa:');
    console.log('1. Abra o Supabase Dashboard');
    console.log('2. Vá em SQL Editor');
    console.log('3. Copie e cole o conteúdo de APLICAR_GATE5_RLS_FIX.sql');
    console.log('4. Execute');
    return false;
  }

  // Testar acesso
  console.log('\n🧪 Testando acesso após aplicar RLS...\n');

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
    console.error('Código:', error.code);
    return false;
  }

  console.log('✅ Teste passou!');
  console.log('Dados:', data);

  console.log('\n✅ RLS Fix aplicado e testado com sucesso!');
  return true;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
