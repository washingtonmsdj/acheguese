import { createClient } from '@supabase/supabase-js';
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
    console.log('📦 Aplicando migration do Gate 5 via queries diretas...\n');
    
    // 1. Adicionar colunas
    console.log('1. Adicionando colunas...');
    const { error: alterError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE driver_availability
          ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS active_ride_id UUID,
          ADD COLUMN IF NOT EXISTS busy_since TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS active_ride_mode TEXT;
      `
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.log('⚠️  Colunas podem já existir ou precisam ser adicionadas manualmente');
    } else {
      console.log('✅ Colunas adicionadas');
    }
    
    // 2. Verificar estrutura
    console.log('\n2. Verificando estrutura...');
    const { data: columns, error: colError } = await supabase
      .from('driver_availability')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.error('❌ Erro ao verificar:', colError);
    } else {
      console.log('✅ Tabela driver_availability acessível');
      if (columns && columns.length > 0) {
        console.log('Colunas disponíveis:', Object.keys(columns[0]));
      }
    }
    
    console.log('\n⚠️  ATENÇÃO: Migration completa precisa ser aplicada manualmente no Supabase Dashboard');
    console.log('Arquivo: supabase/migrations/20260407000007_gate5_driver_availability.sql');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

applyMigration();
