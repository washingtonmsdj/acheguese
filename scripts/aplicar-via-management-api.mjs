/**
 * Script para aplicar migration via Supabase Management API
 * Usa SUPABASE_ACCESS_TOKEN
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'xhdowzacfujckjelqhtd';

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN não encontrado em .env.local');
  process.exit(1);
}

async function aplicar() {
  console.log('🔧 Aplicando migration via Management API...\n');

  const sql = readFileSync('supabase/migrations/20260328000002_rpc_invite_member_secure.sql', 'utf-8');

  try {
    // Usar Management API para executar SQL
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro na API:', response.status, error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('Resultado:', JSON.stringify(result, null, 2));

    // Testar RPC
    console.log('\n🧪 Testando RPC...\n');
    
    const testResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `SELECT invite_profile_member_by_email('00000000-0000-0000-0000-000000000000', 'teste@exemplo.com', 'member');`,
      }),
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log('Resultado do teste:', JSON.stringify(testResult, null, 2));
    }

    console.log('\n✅ CONCLUÍDO!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

aplicar();
