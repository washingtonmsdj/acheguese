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

console.log('GATE 5: Aplicando RLS Fix via supabase db push');
console.log(`Project: ${project}`);
console.log('');

// DB URL (percent-encoded)
const dbUrl = `postgresql://postgres.${project}:${encodeURIComponent(key)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('Executando supabase db push...');
console.log('');

try {
  // Usar supabase db push com --include-all para aplicar todas as migrations
  const output = execSync(`supabase db push --db-url "${dbUrl}" --include-all`, {
    encoding: 'utf-8',
    stdio: 'inherit',
    cwd: join(__dirname, '..'),
  });
  
  console.log('');
  console.log('Sucesso!');
} catch (error) {
  console.error('');
  console.error('Erro ao executar');
  console.error('Codigo:', error.status);
  process.exit(1);
}
