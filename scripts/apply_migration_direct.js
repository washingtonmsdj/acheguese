/**
 * Aplica a migration de rede/filiais diretamente via pg
 * Usa a connection string do Supabase com a senha do banco
 * 
 * USO:
 *   SUPABASE_DB_PASSWORD=<senha> node scripts/apply_migration_direct.js
 * 
 * A senha está no Supabase Dashboard: Settings > Database > Database password
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error('❌ SUPABASE_DB_PASSWORD não definida');
  console.error('   Obtenha em: Supabase Dashboard > Settings > Database > Database password');
  console.error('   Execute: SUPABASE_DB_PASSWORD=<senha> node scripts/apply_migration_direct.js');
  process.exit(1);
}

const connectionString = `postgresql://postgres.xhdowzacfujckjelqhtd:${password}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;

const migrationFile = path.join(__dirname, '../supabase/migrations/20260401000001_create_network_branches.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    console.log('Conectando ao banco...');
    await client.connect();
    console.log('✅ Conectado');
    
    console.log('Aplicando migration...');
    await client.query(sql);
    console.log('✅ Migration aplicada com sucesso');
    
    // Verificar colunas
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'business_data' 
        AND column_name IN ('business_role', 'parent_business_id', 'is_headquarters', 'unit_name')
      ORDER BY column_name
    `);
    console.log('\n✅ Colunas criadas:');
    rows.forEach(r => console.log(`   ${r.column_name}: ${r.data_type}`));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
