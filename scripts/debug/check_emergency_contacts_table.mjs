#!/usr/bin/env node
/**
 * Verificar se tabela emergency_contacts existe
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando tabela emergency_contacts...\n');

// Tentar query simples
const { data, error, count } = await supabase
  .from('emergency_contacts')
  .select('*', { count: 'exact', head: false })
  .limit(5);

if (error) {
  console.log('❌ Tabela NÃO existe');
  console.log(`   Erro: ${error.message}\n`);
  console.log('📋 AÇÃO NECESSÁRIA:');
  console.log('   1. Abra o Supabase Dashboard');
  console.log('   2. Vá em SQL Editor');
  console.log('   3. Cole o conteúdo de: CREATE_EMERGENCY_CONTACTS_TABLE.sql');
  console.log('   4. Execute o SQL\n');
  process.exit(1);
} else {
  console.log('✅ Tabela emergency_contacts EXISTE!');
  console.log(`   Registros: ${count || 0}`);
  
  if (data && data.length > 0) {
    console.log('\n📋 Primeiros registros:');
    data.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.name} (${row.phone}) - Primary: ${row.is_primary}`);
    });
  }
  
  console.log('\n✅ Tabela pronta para uso!\n');
}
