/**
 * Verifica constraints via tentativa de inserção
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  VERIFICAÇÃO DE SCHEMA E CONSTRAINTS');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Verificar se colunas legadas existem
  console.log('📋 Verificando colunas legadas...\n');
  
  const tables = [
    { name: 'business_data', legacyColumns: ['address', 'neighborhood', 'latitude', 'longitude'] },
    { name: 'professional_data', legacyColumns: [] },
    { name: 'user_residences', legacyColumns: ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'postal_code'] },
    { name: 'ride_requests', legacyColumns: ['origin', 'destination', 'pickup_location', 'dropoff_location'] },
  ];
  
  for (const table of tables) {
    console.log(`${table.name}:`);
    
    if (table.legacyColumns.length === 0) {
      console.log('  (sem colunas legadas para verificar)');
      continue;
    }
    
    for (const col of table.legacyColumns) {
      const { error } = await supabase
        .from(table.name)
        .select(col)
        .limit(1);
      
      if (error && (error.message.includes('column') || error.code === '42703')) {
        console.log(`  ✅ ${col} - REMOVIDA`);
      } else {
        console.log(`  ⚠️  ${col} - AINDA EXISTE`);
      }
    }
    console.log('');
  }
  
  // Verificar constraints via describe
  console.log('\n📊 Verificando constraints NOT NULL...\n');
  
  // business_data
  const { data: bd } = await supabase
    .from('business_data')
    .select('*')
    .limit(1)
    .single();
  
  console.log('business_data - campos disponíveis:', Object.keys(bd || {}));
  
  // professional_data
  const { data: pd } = await supabase
    .from('professional_data')
    .select('*')
    .limit(1)
    .single();
  
  console.log('professional_data - campos disponíveis:', Object.keys(pd || {}));
  
  // user_residences
  const { data: ur } = await supabase
    .from('user_residences')
    .select('*')
    .limit(1)
    .single();
  
  console.log('user_residences - campos disponíveis:', ur ? Object.keys(ur) : 'nenhum registro');
  
  // ride_requests
  const { data: rr } = await supabase
    .from('ride_requests')
    .select('*')
    .limit(1)
    .single();
  
  console.log('ride_requests - campos disponíveis:', rr ? Object.keys(rr) : 'nenhum registro');
}

main();
