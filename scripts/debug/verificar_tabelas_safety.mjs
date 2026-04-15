#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 VERIFICANDO TABELAS SAFETY EXISTENTES\n');

const tabelasParaVerificar = [
  'ride_shares',
  'safety_incidents',
  'safety_evidence',
  'safety_audit_log',
  'emergency_alerts',
  'emergency_contacts',
  'emergency_delivery_log'
];

console.log('Testando acesso às tabelas...\n');

for (const tabela of tabelasParaVerificar) {
  try {
    const { error } = await supabase.from(tabela).select('id').limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ ${tabela}: NÃO EXISTE`);
      } else {
        console.log(`⚠️  ${tabela}: EXISTE mas bloqueada (${error.message})`);
      }
    } else {
      console.log(`✅ ${tabela}: EXISTE e acessível`);
    }
  } catch (e) {
    console.log(`❌ ${tabela}: ERRO (${e.message})`);
  }
}

console.log('\n═══════════════════════════════════════════════════════\n');
