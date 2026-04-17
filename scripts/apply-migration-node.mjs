/**
 * Aplica a migration 20260416190000 via Supabase Management API
 * Descriptografa a service role key via DPAPI (Windows) e executa o SQL
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

const PROJECT_REF = 'xhdowzacfujckjelqhtd';
const MIGRATION_FILE = 'supabase/migrations/20260416190000_migrate_vaga_status_enum.sql';

// ── 1. Descriptografar service role key via PowerShell DPAPI ──────────────────
function getServiceRoleKey() {
  const secretsPath = join(
    process.env.APPDATA,
    'Ordax', 'Secrets', PROJECT_REF, 'supabase-secrets.json.dpapi'
  );

  const psScript = `
Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String((Get-Content '${secretsPath.replace(/\\/g, '\\\\')}' -Raw | ConvertFrom-Json).keys.SUPABASE_SERVICE_ROLE_KEY)
$plain = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[System.Text.Encoding]::UTF8.GetString($plain)
`.trim();

  const result = execSync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
    encoding: 'utf8',
    timeout: 15000,
  });

  return result.trim();
}

// ── 2. Executar SQL via Supabase Management API ───────────────────────────────
async function runSQL(serviceRoleKey, sql) {
  // A Management API aceita SQL direto no endpoint /v1/projects/{ref}/database/query
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text;
}

// ── 3. Fallback: executar via psql se disponível ──────────────────────────────
async function runViaPsql(serviceRoleKey, sql) {
  // Construir connection string do Supabase (pooler session mode porta 5432)
  // Formato: postgresql://postgres.{ref}:{password}@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  // A service role key não é a senha do banco — precisamos da DB password
  // Tentar via Management API primeiro
  throw new Error('psql requer DB password separada');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Descriptografando service role key...');
  let serviceRoleKey;
  try {
    serviceRoleKey = getServiceRoleKey();
    console.log(`✅ Key obtida (${serviceRoleKey.length} chars)`);
  } catch (err) {
    console.error('❌ Falha ao descriptografar:', err.message);
    process.exit(1);
  }

  console.log('📄 Lendo migration...');
  const sql = readFileSync(MIGRATION_FILE, 'utf8');
  console.log(`✅ SQL: ${sql.length} chars`);

  console.log('🚀 Aplicando via Management API...');
  try {
    const result = await runSQL(serviceRoleKey, sql);
    console.log('✅ Migration aplicada com sucesso!');
    console.log('Resposta:', result.substring(0, 500));
  } catch (err) {
    console.error('❌ Erro na Management API:', err.message);
    
    // Tentar dividir em statements menores se a API não aceitar tudo de uma vez
    console.log('\n🔄 Tentando executar em partes...');
    await runInParts(serviceRoleKey, sql);
  }
}

async function runInParts(serviceRoleKey, sql) {
  // Dividir por blocos DO $$ ... $$ e statements simples
  // Estratégia: separar por ALTER TYPE (que não pode estar em transação)
  // e executar cada parte individualmente
  
  const parts = splitSQL(sql);
  console.log(`📦 ${parts.length} partes para executar`);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part || part.startsWith('--')) continue;

    console.log(`\n[${i + 1}/${parts.length}] Executando: ${part.substring(0, 80).replace(/\n/g, ' ')}...`);
    
    try {
      const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: part }),
      });

      const text = await response.text();
      if (!response.ok) {
        console.error(`  ❌ HTTP ${response.status}: ${text.substring(0, 200)}`);
      } else {
        console.log(`  ✅ OK`);
      }
    } catch (err) {
      console.error(`  ❌ Erro: ${err.message}`);
    }
  }
}

function splitSQL(sql) {
  // Separar em statements individuais preservando blocos DO $$ ... $$
  const parts = [];
  let current = '';
  let inDollarBlock = false;
  let dollarTag = '';
  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detectar início de bloco dollar-quoted
    if (!inDollarBlock) {
      const dollarMatch = trimmed.match(/^DO \$(\w*)\$/i);
      if (dollarMatch) {
        inDollarBlock = true;
        dollarTag = dollarMatch[1];
        current += line + '\n';
        continue;
      }
    }

    // Detectar fim de bloco dollar-quoted
    if (inDollarBlock) {
      current += line + '\n';
      const endTag = `$${dollarTag}$`;
      if (trimmed === endTag + ';' || trimmed === endTag) {
        inDollarBlock = false;
        parts.push(current.trim());
        current = '';
      }
      continue;
    }

    // Statement simples terminado com ;
    current += line + '\n';
    if (trimmed.endsWith(';') && !inDollarBlock) {
      parts.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts.filter(p => p && !p.startsWith('--') && p.length > 3);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
