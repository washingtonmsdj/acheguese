/**
 * GATE 2: Aplicar correção de policy RLS via API
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sql = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20260407000004_gate2_fix_driver_locations_policy.sql'),
  'utf-8'
);

async function applyMigration() {
  console.log('Aplicando correção de policy RLS...\n');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao aplicar migration: ${error}`);
  }

  console.log('✅ Policy RLS corrigida com sucesso\n');
}

applyMigration().catch(console.error);
