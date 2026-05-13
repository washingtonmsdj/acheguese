/**
 * Aplica uma única migration no Supabase remoto
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  throw new Error('SUPABASE_ACCESS_TOKEN nao definida no ambiente.');
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Uso: node apply-single-migration.mjs <arquivo.sql>');
  process.exit(1);
}

const filePath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
const sql = readFileSync(filePath, 'utf-8');

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

console.log(`⏳ Aplicando ${migrationFile}...`);
try {
  await runSQL(sql);
  console.log('✅ Migration aplicada com sucesso!');
} catch (err) {
  console.error(`❌ Erro: ${err.message}`);
  process.exit(1);
}
