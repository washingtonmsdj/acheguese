/**
 * Script para aplicar a migration AAA no Supabase
 * Usa o cliente Supabase para executar SQL
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xhdowzacfujckjelqhtd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY não definido');
  console.error('Defina a variável de ambiente e tente novamente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function applyMigration() {
  console.log('🚀 Aplicando migration Vagas Domain AAA...\n');
  
  try {
    // Verificar se as colunas já existem
    const { data: columns, error: checkError } = await supabase
      .from('vagas')
      .select('highlight_type')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Migration já aplicada (colunas existem)');
      return;
    }
    
    console.log('📋 Colunas não encontradas, aplicando migration...');
    console.log('⚠️  Por favor, copie e cole o conteúdo de:');
    console.log('   supabase/migrations/20260416170000_vagas_domain_aaa.sql');
    console.log('   no SQL Editor do Supabase Dashboard:\n');
    console.log('   👉 https://app.supabase.com/project/xhdowzacfujckjelqhtd/sql\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

applyMigration();
