/**
 * Verifica quais migrations foram aplicadas no banco remoto
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Verificando migrations aplicadas...\n');
  
  const { data, error } = await supabase
    .from('supabase_migrations' as any)
    .select('*')
    .order('version', { ascending: true });
  
  if (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
  
  console.log('📊 Migrations aplicadas:\n');
  
  const etapa12Migrations = data?.filter(m => 
    m.version >= '20260328000024' && m.version <= '20260328000031'
  );
  
  if (etapa12Migrations && etapa12Migrations.length > 0) {
    console.log('ETAPA 12 Migrations:');
    etapa12Migrations.forEach(m => {
      console.log(`  ✅ ${m.version} - ${m.name || 'sem nome'}`);
    });
  } else {
    console.log('⚠️  Nenhuma migration da ETAPA 12 encontrada');
  }
  
  console.log(`\nTotal de migrations: ${data?.length || 0}`);
}

main();
