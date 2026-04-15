#!/usr/bin/env node

/**
 * Criar função exec_sql no Supabase para executar SQL arbitrário
 */

import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: variáveis de ambiente não definidas');
  process.exit(1);
}

// Extrair project ref
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Erro: não foi possível extrair project ref');
  process.exit(1);
}

console.log('🚀 Criando função exec_sql no Supabase\n');
console.log(`📍 Project: ${projectRef}\n`);

// SQL para criar a função
const createFunctionSql = `
-- Criar função para executar SQL arbitrário (apenas para service_role)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Apenas service_role pode executar
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Only service_role can execute arbitrary SQL';
  END IF;

  -- Executar query e retornar resultado
  EXECUTE sql_query INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Garantir que apenas service_role pode executar
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

SELECT '✅ Função exec_sql criada!' AS status;
`;

// Tentar diferentes métodos de conexão
async function tryConnection() {
  // Método 1: Pooler connection
  const connectionStrings = [
    `postgresql://postgres:${supabaseKey}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${supabaseKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  ];

  for (const connStr of connectionStrings) {
    console.log(`🔄 Tentando: ${connStr.substring(0, 60)}...`);

    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('✅ Conectado!\n');

      console.log('📝 Criando função exec_sql...');
      await client.query(createFunctionSql);
      console.log('✅ Função criada com sucesso!\n');

      await client.end();
      return true;
    } catch (error) {
      console.error(`❌ Falhou: ${error.message}\n`);
      try {
        await client.end();
      } catch {}
    }
  }

  return false;
}

tryConnection()
  .then(success => {
    if (success) {
      console.log('✅ Processo concluído!');
      console.log('\n📝 Próximo passo:');
      console.log('  node scripts/apply-gate5-rls-simple.mjs');
      process.exit(0);
    } else {
      console.error('❌ Todas as tentativas falharam');
      console.error('\n📝 Solução manual:');
      console.error('1. Abra Supabase Dashboard > SQL Editor');
      console.error('2. Execute o SQL em scripts/create-exec-function.sql');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
