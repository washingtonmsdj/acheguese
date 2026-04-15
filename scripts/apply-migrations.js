#!/usr/bin/env node

/**
 * Script para aplicar migrations SQL no Supabase
 * Uso: node scripts/apply-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configurar cliente Supabase com service role
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Iniciando aplicação de migrations...\n');

/**
 * Executa SQL no Supabase
 */
async function executeSql(sql, description) {
  console.log(`📝 Executando: ${description}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Se a função exec_sql não existir, tentar método alternativo
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  Função exec_sql não existe, usando método alternativo...');
        return await executeSqlDirect(sql, description);
      }
      throw error;
    }
    
    console.log(`✅ ${description} - Sucesso\n`);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${description} - Erro:`, error.message);
    return { success: false, error };
  }
}

/**
 * Executa SQL diretamente (método alternativo)
 */
async function executeSqlDirect(sql, description) {
  console.log(`🔄 Tentando método direto para: ${description}`);
  
  // Dividir SQL em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    try {
      // Para CREATE FUNCTION, usar rpc direto
      if (statement.toLowerCase().includes('create or replace function')) {
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
      } else {
        // Para outros comandos, tentar via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(error);
        }
      }
      successCount++;
    } catch (error) {
      console.warn(`⚠️  Statement falhou (pode ser esperado):`, error.message.substring(0, 100));
      errorCount++;
    }
  }
  
  console.log(`✅ ${description} - ${successCount} statements executados, ${errorCount} falharam\n`);
  return { success: successCount > 0, successCount, errorCount };
}

/**
 * Aplica migration de arquivo
 */
async function applyMigration(filePath, description) {
  try {
    const sql = readFileSync(filePath, 'utf-8');
    return await executeSql(sql, description);
  } catch (error) {
    console.error(`❌ Erro ao ler arquivo ${filePath}:`, error.message);
    return { success: false, error };
  }
}

/**
 * Verifica se migrations foram aplicadas
 */
async function verifyMigrations() {
  console.log('🔍 Verificando migrations aplicadas...\n');
  
  // Verificar RPC functions
  console.log('📋 Verificando RPC functions:');
  const { data: functions, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname')
    .in('proname', ['get_business_reviews', 'can_user_review_business']);
  
  if (!funcError && functions) {
    console.log(`✅ ${functions.length} RPC functions encontradas`);
    functions.forEach(f => console.log(`   - ${f.proname}`));
  } else {
    console.log('⚠️  Não foi possível verificar RPC functions via query');
  }
  
  // Verificar localizações
  console.log('\n📋 Verificando localizações:');
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('geographic_path, name, type')
    .like('geographic_path', 'ba%')
    .order('geographic_path');
  
  if (!locError && locations) {
    console.log(`✅ ${locations.length} localizações encontradas`);
    locations.forEach(l => console.log(`   - ${l.geographic_path} (${l.name})`));
  } else {
    console.log('❌ Erro ao verificar localizações:', locError?.message);
  }
  
  console.log('\n');
}

/**
 * Main
 */
async function main() {
  const migrations = [
    {
      file: join(rootDir, 'supabase/migrations/20260413000001_fix_review_rpc_functions.sql'),
      description: 'RPC Functions para Reviews'
    },
    {
      file: join(rootDir, 'supabase/migrations/20260413000002_seed_locations.sql'),
      description: 'Seed de Localizações'
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    const result = await applyMigration(migration.file, migration.description);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('━'.repeat(60));
  console.log(`\n📊 Resumo:`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas: ${failCount}`);
  console.log('');
  
  // Verificar resultados
  await verifyMigrations();
  
  console.log('━'.repeat(60));
  console.log('\n🎉 Processo concluído!\n');
  
  if (failCount > 0) {
    console.log('⚠️  Algumas migrations falharam. Verifique os logs acima.');
    console.log('💡 Você pode aplicar manualmente via Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql\n');
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
