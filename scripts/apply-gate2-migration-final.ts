/**
 * GATE 2: Aplicar Migration de driver_locations
 * 
 * Adiciona colunas GPS faltantes: accuracy, heading, speed, altitude
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkColumns() {
  console.log('🔍 Verificando colunas atuais...\n');
  
  const { data, error } = await supabase
    .from('driver_locations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
    return null;
  }

  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  console.log('📋 Colunas existentes:', columns.join(', '));
  
  const requiredColumns = ['accuracy', 'heading', 'speed', 'altitude'];
  const missingColumns = requiredColumns.filter(col => !columns.includes(col));
  
  if (missingColumns.length === 0) {
    console.log('✅ Todas as colunas GPS já existem!');
    return true;
  }
  
  console.log('⚠️  Colunas faltantes:', missingColumns.join(', '));
  return false;
}

async function applyMigration() {
  console.log('🚀 GATE 2: Aplicação de Migration\n');
  console.log('=' .repeat(50));
  console.log('\n');

  // Verificar estado atual
  const allColumnsExist = await checkColumns();
  
  if (allColumnsExist) {
    console.log('\n✅ Migration já foi aplicada anteriormente');
    console.log('\n📝 Próximos passos:');
    console.log('  1. npm run test tests/e2e/gate2-tracking-pipeline.test.ts');
    return;
  }

  console.log('\n❌ BLOQUEIO TÉCNICO IDENTIFICADO\n');
  console.log('=' .repeat(50));
  console.log('\nNão tenho acesso programático ao SQL Editor do Supabase.');
  console.log('A função exec_sql() não existe no banco de dados.');
  console.log('\n📋 APLICAÇÃO MANUAL NECESSÁRIA:\n');
  
  console.log('1️⃣  Acesse o SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].split('//')[1]}/sql\n`);
  
  console.log('2️⃣  Clique em "New query"\n');
  
  console.log('3️⃣  Cole e execute o seguinte SQL:\n');
  console.log('─'.repeat(50));
  
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260407000002_gate2_driver_locations_minimal.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log(migrationSQL);
  console.log('─'.repeat(50));
  
  console.log('\n4️⃣  Após executar, valide com:');
  console.log('   SELECT column_name FROM information_schema.columns');
  console.log('   WHERE table_name = \'driver_locations\';');
  
  console.log('\n5️⃣  Execute este script novamente para confirmar:');
  console.log('   npm run apply:gate2\n');
  
  console.log('📄 Arquivo da migration:');
  console.log(`   ${migrationPath}\n`);
  
  console.log('=' .repeat(50));
}

applyMigration().catch(error => {
  console.error('\n❌ Erro:', error);
  process.exit(1);
});
