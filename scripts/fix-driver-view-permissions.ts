import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDriverViewPermissions() {
  console.log('🔧 Corrigindo permissões da view driver_complete_profile...');
  
  const sql = `
    -- Garantir que a view pode ser acessada por usuários autenticados
    GRANT SELECT ON driver_complete_profile TO authenticated;
    GRANT SELECT ON driver_complete_profile TO anon;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Erro ao executar SQL:', error);
    
    // Tentar método alternativo: verificar se a view existe
    console.log('\n🔍 Verificando se a view existe...');
    const { data: viewData, error: viewError } = await supabase
      .from('driver_complete_profile')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.error('❌ View não acessível:', viewError);
      console.log('\n💡 Solução: Execute este SQL no Supabase SQL Editor:');
      console.log(sql);
    } else {
      console.log('✅ View está acessível!');
      console.log('Dados de teste:', viewData);
    }
    
    process.exit(1);
  }

  console.log('✅ Permissões corrigidas com sucesso!');
}

fixDriverViewPermissions().catch(console.error);
