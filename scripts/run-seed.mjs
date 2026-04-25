#!/usr/bin/env node
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection string format:
// postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const connectionString = 'postgresql://postgres.xhdowzacfujckjelqhtd:[YOUR-DB-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runSeed() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();

    console.log('📦 Reading seed file...');
    const seedPath = join(__dirname, '..', 'supabase', 'seed_bella_napoli_mock.sql');
    const sql = readFileSync(seedPath, 'utf-8');

    console.log('🚀 Executing seed SQL...');
    await client.query(sql);

    console.log('✅ Seed executed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
