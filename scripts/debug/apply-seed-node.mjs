#!/usr/bin/env node
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ SUPABASE_DB_URL não definida');
  console.error('   Configure no arquivo .env:');
  console.error('   SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres');
  process.exit(1);
}

console.log('🚀 Conectando ao banco remoto...');
const client = new Client({ connectionString });

try {
  await client.connect();
  console.log('✅ Conectado!');
  
  console.log('📖 Lendo seed_final.sql...');
  const sql = readFileSync('seed_final.sql', 'utf8');
  
  console.log('📤 Executando SQL...');
  const result = await client.query(sql);
  
  console.log('✅ Seed aplicado com sucesso!');
  console.log('📊 Resultado:', result.rows);
  
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
