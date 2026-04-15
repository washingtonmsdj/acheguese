#!/usr/bin/env node

/**
 * Script para aplicar migrations SQL no Supabase via REST API
 * Uso: node scripts/apply-migrations-direct.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

console.log('🚀 Aplicando migrations via REST API...\n');
console.log(`📍 URL: ${supabaseUrl}\n`);

/**
 * Executa SQL via REST API do Supabase
 */
async function executeSqlViaApi(sql, description) {
  console.log(`📝 ${description}`);
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Sucesso\n`);
    return { success: true, result };
  } catch (error) {
    console.error(`❌ Erro: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Aplica SQL statement por statement
 */
async function applyMigrationStatements(filePath, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 ${description}`);
  console.log(`📄 Arquivo: ${filePath}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    const sql = readFileSync(filePath, 'utf-8');
    
    // Dividir em statements (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Remover comentários e linhas vazias
        const cleaned = s.replace(/--.*$/gm, '').trim();
        return cleaned.length > 0;
      });
    
    console.log(`📊 Total de statements: ${statements.length}\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);
      
      // Pular comentários de bloco
      if (statement.startsWith('/*') || statement.includes('COMMENT ON')) {
        console.log('   ⏭️  Pulando (comentário)\n');
        skipCount++;
        continue;
      }
      
      const result = await executeSqlViaApi(statement, `Statement ${i + 1}`);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        // Continuar mesmo com erro (alguns podem ser esperados, como "já existe")
        if (result.error.includes('already exists') || result.error.includes('duplicate')) {
          console.log('   ℹ️  Objeto já existe (OK)\n');
          successCount++;
          errorCount--;
        }
      }
    }
    
    console.log(`\n📊 Resumo do arquivo:`);
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⏭️  Pulados: ${skipCount}`);
    console.log(`   ❌ Erros: ${errorCount}\n`);
    
    return { success: errorCount === 0, successCount, errorCount, skipCount };
  } catch (error) {
    console.error(`❌ Erro ao processar arquivo:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Método alternativo: Copiar SQL para clipboard
 */
function showManualInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 INSTRUÇÕES PARA APLICAÇÃO MANUAL');
  console.log('='.repeat(60) + '\n');
  
  console.log('Como a API REST não suporta execução direta de SQL,');
  console.log('você precisa aplicar as migrations manualmente:\n');
  
  console.log('1️⃣  Acesse o Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql\n');
  
  console.log('2️⃣  Abra e copie o conteúdo destes arquivos:\n');
  console.log('   📄 supabase/migrations/20260413000001_fix_review_rpc_functions.sql');
  console.log('   📄 supabase/migrations/20260413000002_seed_locations.sql\n');
  
  console.log('   OU use o arquivo consolidado:\n');
  console.log('   📄 APLICAR_NO_SUPABASE_SQL_EDITOR.sql\n');
  
  console.log('3️⃣  Cole no SQL Editor e clique em "Run"\n');
  
  console.log('4️⃣  Verifique os resultados:\n');
  
  console.log('   -- Verificar RPC functions');
  console.log('   SELECT routine_name FROM information_schema.routines');
  console.log('   WHERE routine_name IN (\'get_business_reviews\', \'can_user_review_business\');\n');
  
  console.log('   -- Verificar localizações');
  console.log('   SELECT geographic_path, name FROM locations');
  console.log('   WHERE geographic_path LIKE \'ba%\';');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main
 */
async function main() {
  console.log('⚠️  AVISO: A API REST do Supabase não suporta execução direta de SQL.\n');
  console.log('As migrations precisam ser aplicadas via SQL Editor do dashboard.\n');
  
  showManualInstructions();
  
  // Tentar via API mesmo assim (pode funcionar em alguns casos)
  console.log('🔄 Tentando aplicar via API (pode falhar)...\n');
  
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
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  for (const migration of migrations) {
    const result = await applyMigrationStatements(migration.file, migration.description);
    if (result.successCount) totalSuccess += result.successCount;
    if (result.errorCount) totalErrors += result.errorCount;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Statements executados: ${totalSuccess}`);
  console.log(`❌ Erros: ${totalErrors}`);
  console.log('='.repeat(60) + '\n');
  
  if (totalErrors > 0 || totalSuccess === 0) {
    console.log('⚠️  Recomendação: Aplicar manualmente via SQL Editor (instruções acima)\n');
  } else {
    console.log('🎉 Migrations aplicadas com sucesso!\n');
  }
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
