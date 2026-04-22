#!/usr/bin/env node

/**
 * Script para aplicar migrations usando Supabase CLI
 * Aplica apenas as migrations específicas
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const migrations = [
  '20260413100000_create_business_subscriptions.sql',
  '20260413100001_create_business_premium_links.sql',
  '20260413100002_migrate_gastronomy_to_business_subscriptions.sql',
  '20260413110000_create_qr_codes_system.sql'
];

console.log('🚀 Aplicando Migrations: Billing + QR Code\n');

// Estratégia: Criar um arquivo SQL temporário com todas as migrations
console.log('📦 Consolidando migrations...');

let consolidatedSql = `
-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATIONS CONSOLIDADAS: Billing + QR Code
-- Aplicadas em: ${new Date().toISOString()}
-- ══════════════════════════════════════════════════════════════════════════

`;

for (const migration of migrations) {
  console.log(`   📄 Lendo: ${migration}`);
  const sqlPath = join('supabase', 'migrations', migration);
  const sql = readFileSync(sqlPath, 'utf-8');
  
  consolidatedSql += `\n\n-- ══════════════════════════════════════════════════════════════════════════\n`;
  consolidatedSql += `-- MIGRATION: ${migration}\n`;
  consolidatedSql += `-- ══════════════════════════════════════════════════════════════════════════\n\n`;
  consolidatedSql += sql;
}

// Salvar arquivo consolidado
const consolidatedPath = 'supabase/migrations/99999999999999_apply_billing_qr.sql';
writeFileSync(consolidatedPath, consolidatedSql);
console.log(`\n✅ Migrations consolidadas em: ${consolidatedPath}`);

// Tentar aplicar via supabase db push
console.log('\n🔧 Aplicando via Supabase CLI...\n');

try {
  // Aplicar apenas essa migration específica
  const output = execSync('supabase db push', {
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ Migrations aplicadas com sucesso!');
  
  // Remover arquivo temporário
  execSync(`rm ${consolidatedPath}`);
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro ao aplicar migrations:', error.message);
  console.log('\n💡 Tentando abordagem alternativa...\n');
  
  // Abordagem alternativa: Aplicar via psql direto
  try {
    console.log('🔧 Aplicando via psql...');
    
    // Ler DATABASE_URL do .env
    const envContent = readFileSync('.env', 'utf-8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
    
    if (!dbUrlMatch) {
      throw new Error('DATABASE_URL não encontrada no .env');
    }
    
    const dbUrl = dbUrlMatch[1];
    console.log(`📍 Database URL encontrada`);
    
    // Aplicar via psql
    execSync(`psql "${dbUrl}" -f ${consolidatedPath}`, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    console.log('\n✅ Migrations aplicadas via psql!');
    
    // Remover arquivo temporário
    execSync(`rm ${consolidatedPath}`);
    
    process.exit(0);
  } catch (psqlError) {
    console.error('\n❌ Erro ao aplicar via psql:', psqlError.message);
    console.log(`\n📝 Arquivo SQL consolidado salvo em: ${consolidatedPath}`);
    console.log('\n💡 Você pode aplicar manualmente executando:');
    console.log(`   supabase db execute --file ${consolidatedPath}`);
    console.log('   ou');
    console.log(`   psql $DATABASE_URL -f ${consolidatedPath}`);
    process.exit(1);
  }
}
