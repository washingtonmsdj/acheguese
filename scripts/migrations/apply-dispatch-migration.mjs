#!/usr/bin/env node

/**
 * APPLY DISPATCH MIGRATION
 * 
 * Script para aplicar migration do RPC accept_ride_atomic
 * Usa Supabase Management API
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

console.log('🚀 Aplicando migration do dispatch híbrido...\n');

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Ler arquivo SQL
const migrationFile = 'src/modules/mobility/migrations/create_accept_ride_atomic_rpc.sql';
let sqlContent;

try {
  sqlContent = readFileSync(migrationFile, 'utf-8');
  console.log('✅ Arquivo de migration carregado');
} catch (error) {
  console.error(`❌ Erro ao ler arquivo: ${migrationFile}`);
  console.error(error.message);
  process.exit(1);
}

console.log('\n📊 Informações da migration:');
console.log(`   Arquivo: ${migrationFile}`);
console.log(`   Tamanho: ${sqlContent.length} caracteres`);
console.log(`   URL: ${SUPABASE_URL}`);

console.log('\n🔄 Executando SQL...\n');

// Executar SQL via RPC
// Nota: Supabase não tem endpoint direto para executar SQL arbitrário
// Vamos usar uma abordagem alternativa: executar via query direto

try {
  // Tentar executar via rpc (se existir função helper)
  const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
  
  if (error) {
    // Se não existir exec_sql, tentar abordagem alternativa
    console.log('⚠️  RPC exec_sql não disponível, usando abordagem alternativa...\n');
    
    // Dividir SQL em statements individuais
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executando ${statements.length} statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`   ${i + 1}. Criando função accept_ride_atomic...`);
      } else if (statement.includes('COMMENT ON FUNCTION')) {
        console.log(`   ${i + 1}. Adicionando comentário...`);
      } else if (statement.includes('GRANT EXECUTE')) {
        console.log(`   ${i + 1}. Concedendo permissões...`);
      } else {
        console.log(`   ${i + 1}. Executando statement...`);
      }
      
      // Nota: Supabase JS não permite executar SQL arbitrário por segurança
      // A migration deve ser aplicada via Supabase Dashboard
    }
    
    console.log('\n⚠️  ATENÇÃO: Migration não pode ser aplicada automaticamente via API');
    console.log('\n📝 Aplique manualmente via Supabase Dashboard:');
    console.log(`   1. Acesse: ${SUPABASE_URL.replace('/rest/v1', '')}/project/_/sql`);
    console.log(`   2. Cole o conteúdo de: ${migrationFile}`);
    console.log('   3. Clique em "Run"');
    console.log('\n💡 Ou use o Supabase CLI:');
    console.log(`   supabase db execute --file ${migrationFile}`);
    
    process.exit(0);
  }
  
  console.log('✅ Migration aplicada com sucesso!\n');
  console.log('📝 Próximos passos:');
  console.log('   1. Testar aceite de corrida');
  console.log('   2. Testar concorrência');
  console.log('   3. Atualizar componentes UI\n');
  
} catch (error) {
  console.error('❌ Erro ao aplicar migration:');
  console.error(error.message);
  console.error('\n💡 Aplique manualmente via Supabase Dashboard');
  process.exit(1);
}
