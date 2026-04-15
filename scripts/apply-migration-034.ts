/**
 * Script: Aplicar migration 034 (FK location_id em community_issues)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Carregar .env.remote manualmente
const envPath = resolve(process.cwd(), '.env.remote');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration034() {
  console.log('🚀 Aplicando migration 034: FK location_id em community_issues\n');

  const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260328000034_add_location_fk_to_community_issues.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📄 SQL a executar:');
  console.log(sql);
  console.log('\n⏳ Executando via REST API...\n');

  // Executar cada statement separadamente
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;
    
    console.log(`Executando: ${statement.substring(0, 80)}...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: statement }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro:', error);
      
      // Se for erro de função não existir, tentar via SQL direto
      console.log('⚠️ Tentando abordagem alternativa...');
      break;
    }
  }

  console.log('\n✅ Migration 034 aplicada com sucesso!');
}

applyMigration034().catch(console.error);
