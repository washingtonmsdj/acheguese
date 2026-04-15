/**
 * Aplica migrations via Supabase REST API usando o endpoint correto.
 * Testa múltiplos endpoints até encontrar o que funciona.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const PROJECT_REF  = 'xhdowzacfujckjelqhtd';
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

// Testar todos os endpoints conhecidos do Supabase para execução de SQL
async function testEndpoints() {
  const testSQL = 'SELECT 1 as test';

  const endpoints = [
    // Supabase REST API v1 (requer service_role)
    { name: 'pg/query', url: `${SUPABASE_URL}/pg/query`, body: { query: testSQL } },
    { name: 'rest/v1/rpc/query', url: `${SUPABASE_URL}/rest/v1/rpc/query`, body: { query: testSQL } },
    // Supabase Edge Functions (se existir)
    { name: 'functions/v1/sql', url: `${SUPABASE_URL}/functions/v1/sql`, body: { sql: testSQL } },
    // Endpoint de migrations
    { name: 'rest/v1/rpc/migrate', url: `${SUPABASE_URL}/rest/v1/rpc/migrate`, body: { sql: testSQL } },
    // Endpoint direto do PostgREST para SQL
    { name: 'rest/v1/rpc/sql', url: `${SUPABASE_URL}/rest/v1/rpc/sql`, body: { query: testSQL } },
  ];

  console.log('Testando endpoints disponíveis:\n');

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
        },
        body: JSON.stringify(ep.body),
      });
      const text = await r.text().catch(() => '');
      console.log(`  ${ep.name}: HTTP ${r.status} — ${text.substring(0, 100)}`);
    } catch (e: any) {
      console.log(`  ${ep.name}: ERRO — ${e.message}`);
    }
  }
}

async function main() {
  await testEndpoints();
}

main();
