/**
 * Verifica constraints NOT NULL no banco remoto
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkConstraints() {
  console.log('🔍 Verificando constraints NOT NULL...\n');
  
  const query = `
    SELECT 
      table_name,
      column_name,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('business_data', 'professional_data', 'user_residences', 'ride_requests')
      AND column_name IN ('location_id', 'address_id', 'pickup_address_id', 'dropoff_address_id', 'pickup_location_id', 'dropoff_location_id')
    ORDER BY table_name, column_name;
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: query });
  
  if (error) {
    // Tentar query direta
    const { data: directData, error: directError } = await supabase
      .from('information_schema.columns' as any)
      .select('table_name, column_name, is_nullable');
    
    console.log('Erro RPC:', error.message);
    console.log('Tentando query SQL direta via psql...\n');
    return;
  }
  
  console.log('Constraints encontrados:');
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  await checkConstraints();
}

main();
