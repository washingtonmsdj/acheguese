/**
 * Aplica todas as migrations no Supabase remoto via Management API
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

async function runSQL(sql, label) {
  const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // Tenta via pg endpoint
    const res2 = await fetch(`https://${PROJECT_REF}.supabase.co/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res2.text();
    if (!res2.ok) {
      throw new Error(`HTTP ${res2.status}: ${text}`);
    }
    return text;
  }

  return res.json();
}

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📦 ${files.length} migrations encontradas\n`);

  for (const file of files) {
    const filePath = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, 'utf-8');

    process.stdout.write(`⏳ ${file} ... `);
    try {
      await runSQL(sql, file);
      console.log('✅');
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log('\n✅ Concluído!');
}

main();
