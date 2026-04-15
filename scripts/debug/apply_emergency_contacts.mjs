#!/usr/bin/env node
/**
 * Aplicar tabela emergency_contacts no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Aplicando tabela emergency_contacts...\n');

// Ler SQL
const sql = readFileSync('CREATE_EMERGENCY_CONTACTS_TABLE.sql', 'utf-8');

// Dividir em statements individuais
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

let successCount = 0;
let errorCount = 0;

for (const statement of statements) {
  try {
    // Executar via query direto
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
    
    if (error) {
      // Tentar executar diretamente se RPC falhar
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql_query: statement })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }
    
    successCount++;
    console.log(`✅ Statement ${successCount} executado`);
  } catch (error) {
    errorCount++;
    console.error(`❌ Erro no statement ${successCount + errorCount}:`, error.message);
  }
}

console.log(`\n📊 Resultado: ${successCount} sucesso, ${errorCount} erros\n`);

// Validar tabela criada
console.log('🔍 Validando tabela...');

const { data: tableCheck, error: tableError } = await supabase
  .from('emergency_contacts')
  .select('count')
  .limit(0);

if (tableError) {
  console.error('❌ Tabela não foi criada:', tableError.message);
  console.log('\n📋 AÇÃO MANUAL NECESSÁRIA:');
  console.log('   1. Abra o SQL Editor do Supabase Dashboard');
  console.log('   2. Cole o conteúdo de CREATE_EMERGENCY_CONTACTS_TABLE.sql');
  console.log('   3. Execute o SQL\n');
  process.exit(1);
} else {
  console.log('✅ Tabela emergency_contacts criada com sucesso!\n');
}
