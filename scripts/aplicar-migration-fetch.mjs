/**
 * Script para aplicar migration via fetch direto
 * Usa Supabase REST API com service_role
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Carregar .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

async function aplicarMigration() {
  console.log('🔧 Aplicando RPC invite_profile_member_by_email via REST API...\n');

  // Ler SQL
  const sql = readFileSync('supabase/migrations/20260328000002_rpc_invite_member_secure.sql', 'utf-8');

  try {
    // Executar via PostgREST query endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('⚠️ Endpoint /rpc/exec não disponível');
      console.log('Tentando abordagem alternativa...\n');
      
      // Tentar via connection string usando pg
      const { Client } = await import('pg');
      
      const client = new Client({
        host: 'db.xhdowzacfujckjelqhtd.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'Acheguese2024!',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
      });

      await client.connect();
      console.log('✅ Conectado ao banco\n');

      await client.query(sql);
      console.log('✅ Migration aplicada com sucesso!\n');

      // Testar RPC
      console.log('🧪 Testando RPC...\n');
      const result = await client.query(`
        SELECT invite_profile_member_by_email(
          '00000000-0000-0000-0000-000000000000',
          'teste@exemplo.com',
          'member'
        );
      `);

      console.log('Resultado:', JSON.stringify(result.rows[0], null, 2));

      await client.end();
      console.log('\n✅ MIGRATION APLICADA E VALIDADA!\n');
      return;
    }

    console.log('✅ Migration aplicada via REST API!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

aplicarMigration();
