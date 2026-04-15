/**
 * Script simples para aplicar migration
 * Usa pg client direto
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const { Client } = pg;

async function aplicar() {
  console.log('Conectando ao banco...\n');

  const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.xhdowzacfujckjelqhtd',
    password: 'Acheguese2024!',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Conectado!\n');

    const sql = readFileSync('supabase/migrations/20260328000002_rpc_invite_member_secure.sql', 'utf-8');
    
    console.log('Aplicando migration...\n');
    await client.query(sql);
    
    console.log('✅ Migration aplicada!\n');

    // Testar
    console.log('Testando RPC...\n');
    const result = await client.query(`
      SELECT invite_profile_member_by_email(
        '00000000-0000-0000-0000-000000000000',
        'teste@exemplo.com',
        'member'
      );
    `);

    console.log('Resultado:', JSON.stringify(result.rows[0], null, 2));
    console.log('\n✅ SUCESSO!\n');

    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await client.end();
    process.exit(1);
  }
}

aplicar();
