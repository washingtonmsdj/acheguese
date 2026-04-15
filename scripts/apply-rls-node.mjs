#!/usr/bin/env node

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
config({ path: join(__dirname, '..', '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Erro: variaveis nao definidas');
  process.exit(1);
}

// Extrair project
const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('Erro: nao foi possivel extrair project');
  process.exit(1);
}

const project = match[1];

console.log('GATE 5: Aplicando RLS Fix');
console.log(`Project: ${project}`);
console.log('');

// DB URL
const dbUrl = `postgresql://postgres.${project}:${key}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

// SQL file
const sqlFile = join(__dirname, '..', 'APLICAR_GATE5_RLS_FIX.sql');

// Executar
console.log('Executando SQL...');
console.log('');

try {
  const output = execSync(`supabase db execute --db-url "${dbUrl}" --file "${sqlFile}"`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  
  console.log('');
  console.log('Sucesso!');
} catch (error) {
  console.error('');
  console.error('Erro ao executar');
  process.exit(1);
}
