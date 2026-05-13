/**
 * Aplica migrations via Supabase Management API
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

if (!ACCESS_TOKEN) {
  throw new Error('SUPABASE_ACCESS_TOKEN nao definida no ambiente.');
}

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text;
}

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📦 ${files.length} migrations encontradas\n`);

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    process.stdout.write(`⏳ ${file} ... `);
    try {
      await runSQL(sql);
      console.log('✅');
    } catch (err) {
      const msg = err.message;
      // Ignorar erros de "já existe"
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log('⚠️  já existe (ignorado)');
      } else {
        console.log(`❌ ${msg.slice(0, 120)}`);
      }
    }
  }

  console.log('\n✅ Concluído!');
}

main();
