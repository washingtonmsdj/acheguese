/**
 * GATE 2: Aplicar correção de policy RLS manualmente
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro: ${error}`);
    return false;
  }

  return true;
}

async function applyPolicyFix() {
  console.log('========================================');
  console.log('GATE 2: Corrigir Policy RLS');
  console.log('========================================\n');

  // 1. Remover policy antiga
  console.log('1. Removendo policy antiga...');
  await executeSql(`DROP POLICY IF EXISTS "Drivers manage own location" ON driver_locations;`);
  console.log('✅ Policy antiga removida\n');

  // 2. Criar policy SELECT
  console.log('2. Criando policy SELECT...');
  await executeSql(`
    CREATE POLICY "driver_locations_select_policy" ON driver_locations
      FOR SELECT
      TO authenticated
      USING (true);
  `);
  console.log('✅ Policy SELECT criada\n');

  // 3. Criar policy INSERT
  console.log('3. Criando policy INSERT...');
  await executeSql(`
    CREATE POLICY "driver_locations_insert_policy" ON driver_locations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        driver_profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
        )
      );
  `);
  console.log('✅ Policy INSERT criada\n');

  // 4. Criar policy UPDATE
  console.log('4. Criando policy UPDATE...');
  await executeSql(`
    CREATE POLICY "driver_locations_update_policy" ON driver_locations
      FOR UPDATE
      TO authenticated
      USING (
        driver_profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
        )
      )
      WITH CHECK (
        driver_profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
        )
      );
  `);
  console.log('✅ Policy UPDATE criada\n');

  // 5. Criar policy DELETE
  console.log('5. Criando policy DELETE...');
  await executeSql(`
    CREATE POLICY "driver_locations_delete_policy" ON driver_locations
      FOR DELETE
      TO authenticated
      USING (
        driver_profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
        )
      );
  `);
  console.log('✅ Policy DELETE criada\n');

  console.log('========================================');
  console.log('✅ POLICIES RLS CORRIGIDAS');
  console.log('========================================\n');
}

applyPolicyFix().catch(console.error);
