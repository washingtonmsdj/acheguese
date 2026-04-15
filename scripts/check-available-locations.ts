/**
 * Verifica locations disponíveis no banco
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Verificando locations disponíveis...\n');
  
  const { data: locations, error, count } = await supabase
    .from('locations')
    .select('id, name, slug, type, status', { count: 'exact' })
    .eq('type', 'district')
    .eq('status', 'active')
    .limit(5);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Total de locations (district, active): ${count}\n`);
  
  if (locations && locations.length > 0) {
    console.log('Primeiras 5 locations:');
    locations.forEach(l => {
      console.log(`  - ${l.name} (${l.slug}) [${l.id}]`);
    });
  } else {
    console.log('⚠️  Nenhuma location encontrada');
  }
}

main();
