import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.test' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigration() {
  try {
    console.log('📦 Aplicando migration do Gate 5...');
    
    const sql = readFileSync('supabase/migrations/20260407000007_gate5_driver_availability.sql', 'utf8');
    
    // Executar SQL diretamente
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Erro ao aplicar migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration aplicada com sucesso!');
    console.log(data);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();
