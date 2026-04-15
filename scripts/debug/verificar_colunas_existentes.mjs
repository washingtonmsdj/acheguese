#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verificando colunas REALMENTE disponíveis...\n');

async function main() {
  // Buscar uma corrida existente para ver quais colunas estão disponíveis
  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Colunas disponíveis na tabela ride_requests:\n');
    const columns = Object.keys(data[0]).sort();
    columns.forEach(col => {
      console.log(`   - ${col}`);
    });
    console.log(`\n📊 Total: ${columns.length} colunas`);
  } else {
    console.log('⚠️  Tabela vazia, não foi possível verificar colunas');
  }
}

main();
