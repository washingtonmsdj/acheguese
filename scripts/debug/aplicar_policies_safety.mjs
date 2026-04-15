#!/usr/bin/env node
/**
 * Aplicar Policies Safety - Via código
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 APLICANDO POLICIES SAFETY\n');

const sql = readFileSync('HARDENING_2_CRIAR_POLICIES_SAFETY.sql', 'utf8');

// Dividir em statements individuais
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'));

console.log(`Total de statements: ${statements.length}\n`);

let success = 0;
let failed = 0;

for (const statement of statements) {
  if (!statement) continue;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: statement });
    
    if (error) {
      // Ignorar erro de policy já existente
      if (error.message.includes('already exists')) {
        console.log('⚠️  Policy já existe (ignorado)');
        success++;
      } else {
        console.log('❌ Erro:', error.message);
        failed++;
      }
    } else {
      console.log('✅ Statement executado');
      success++;
    }
  } catch (e) {
    console.log('❌ Erro:', e.message);
    failed++;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESUMO: ${success} sucesso, ${failed} falhas\n`);

if (failed === 0) {
  console.log('🎉 POLICIES APLICADAS COM SUCESSO!\n');
} else {
  console.log('⚠️  Algumas policies falharam. Verificar erros acima.\n');
}
