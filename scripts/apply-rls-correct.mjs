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
const dbPassword = process.env.SUPABASE_DB_PASSWORD; // Senha do banco (diferente do service key)

if (!url || !key) {
  console.error('Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao definidos');
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

// Verificar se temos a senha do banco
if (!dbPassword) {
  console.log('SUPABASE_DB_PASSWORD nao definida no .env');
  console.log('');
  console.log('Para obter a senha do banco:');
  console.log('1. Abra Supabase Dashboard');
  console.log('2. Va em Settings > Database');
  console.log('3. Copie a senha do banco (Database Password)');
  console.log('4. Adicione no .env: SUPABASE_DB_PASSWORD=sua_senha');
  console.log('');
  console.log('Ou execute manualmente:');
  console.log('1. Abra Supabase Dashboard > SQL Editor');
  console.log('2. Copie e cole o conteudo de APLICAR_GATE5_RLS_FIX.sql');
  console.log('3. Execute');
  process.exit(1);
}

// DB URL com senha correta
const dbUrl = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${project}.supabase.co:5432/postgres`;

console.log('Executando supabase db push...');
console.log('');

try {
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
  console.error('');
  console.error('Solucao manual:');
  console.error('1. Abra Supabase Dashboard > SQL Editor');
  console.error('2. Copie e cole o conteudo de APLICAR_GATE5_RLS_FIX.sql');
  console.error('3. Execute');
  process.exit(1);
}
