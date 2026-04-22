#!/usr/bin/env node

/**
 * Script para aplicar migration da tabela ride_offers
 * 
 * Uso:
 *   node apply-ride-offers-migration.mjs
 * 
 * Requisitos:
 *   - SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  console.error('   Configure no arquivo .env.local');
  process.exit(1);
}

// Cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    return !error || !error.message.includes('does not exist');
  } catch (error) {
    return false;
  }
}

async function executeMigration() {
  console.log('🚀 Iniciando aplicação da migration ride_offers...\n');

  // 1. Verificar se tabela já existe
  console.log('1️⃣ Verificando se tabela ride_offers já existe...');
  const tableExists = await checkTableExists('ride_offers');
  
  if (tableExists) {
    console.log('⚠️  Tabela ride_offers já existe');
    console.log('   Pulando criação da tabela\n');
    return;
  }
  
  console.log('✅ Tabela não existe, prosseguindo com criação\n');

  // 2. Ler arquivo de migration
  console.log('2️⃣ Lendo arquivo de migration...');
  const migrationPath = join(__dirname, 'supabase/migrations/20260416000000_create_ride_offers.sql');
  let migrationSQL;
  
  try {
    migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration lida: ${migrationSQL.length} caracteres\n`);
  } catch (error) {
    console.error('❌ Erro ao ler arquivo de migration:', error.message);
    process.exit(1);
  }

  // 3. Executar migration
  console.log('3️⃣ Executando migration...');
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Tentar executar diretamente via REST API
      console.log('⚠️  Tentando método alternativo...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }
    
    console.log('✅ Migration executada com sucesso\n');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('\n📝 Instruções para aplicação manual:');
    console.error('   1. Acesse o Supabase Dashboard');
    console.error('   2. Vá em SQL Editor');
    console.error('   3. Cole o conteúdo do arquivo:');
    console.error('      supabase/migrations/20260416000000_create_ride_offers.sql');
    console.error('   4. Execute o SQL\n');
    process.exit(1);
  }

  // 4. Verificar criação
  console.log('4️⃣ Verificando criação da tabela...');
  const created = await checkTableExists('ride_offers');
  
  if (created) {
    console.log('✅ Tabela ride_offers criada com sucesso!\n');
  } else {
    console.error('❌ Tabela não foi criada. Verifique os logs acima.\n');
    process.exit(1);
  }

  // 5. Verificar estrutura
  console.log('5️⃣ Verificando estrutura da tabela...');
  try {
    const { data, error } = await supabase
      .from('ride_offers')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('❌ Erro ao verificar estrutura:', error.message);
    } else {
      console.log('✅ Estrutura da tabela verificada\n');
    }
  } catch (error) {
    console.error('⚠️  Não foi possível verificar estrutura:', error.message);
  }

  console.log('🎉 Migration aplicada com sucesso!');
  console.log('\n📊 Próximos passos:');
  console.log('   1. Teste o cancelamento de corridas');
  console.log('   2. Verifique os logs no console');
  console.log('   3. Confirme que não há mais erro 404 em ride_offers\n');
}

// Executar
executeMigration().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
