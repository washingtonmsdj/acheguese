/**
 * Inspeciona business_data para entender estrutura dos dados
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Inspecionando business_data...\n');
  
  const { data: businesses, error } = await supabase
    .from('business_data')
    .select('*')
    .is('location_id', null)
    .limit(3);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
  
  console.log('📊 Amostra de 3 registros sem location_id:\n');
  businesses?.forEach((b, i) => {
    console.log(`\n--- Registro ${i + 1} ---`);
    console.log('ID:', b.id);
    console.log('Address:', b.address);
    console.log('Neighborhood:', b.neighborhood);
    console.log('Latitude:', b.latitude);
    console.log('Longitude:', b.longitude);
    console.log('Metadata:', JSON.stringify(b.metadata, null, 2));
  });
}

main();
