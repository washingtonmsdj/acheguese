/**
 * Inspeciona professional_data para entender estrutura dos dados
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Inspecionando professional_data...\n');
  
  const { data: professionals, error } = await supabase
    .from('professional_data')
    .select('*')
    .is('location_id', null)
    .limit(3);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
  
  console.log('📊 Amostra de 3 registros sem location_id:\n');
  professionals?.forEach((p, i) => {
    console.log(`\n--- Registro ${i + 1} ---`);
    console.log('ID:', p.id);
    console.log('Metadata:', JSON.stringify(p.metadata, null, 2));
  });
}

main();
