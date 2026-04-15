#!/usr/bin/env node

/**
 * Aplicar tabelas de Safety no banco
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

console.log('🗄️  Aplicando tabelas de Safety...\n');
console.log('⚠️  As tabelas já devem ter sido criadas via apply_pricing_safety_migrations.sql');
console.log('   Se não foram, execute manualmente no Supabase SQL Editor:\n');
console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new\n');
console.log('═'.repeat(80));

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verificarTabelas() {
  const tables = [
    'emergency_alerts',
    'safety_incidents', 
    'safety_evidence',
    'ride_shares',
    'safety_audit_log'
  ];

  console.log('\n🔍 Verificando tabelas...\n');

  let todasExistem = true;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('Could not find')) {
          console.log(`   ❌ ${table}: NÃO EXISTE`);
          todasExistem = false;
        } else {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table}: existe (${count || 0} registros)`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: erro ao verificar`);
      todasExistem = false;
    }
  }

  console.log('\n' + '═'.repeat(80));

  if (todasExistem) {
    console.log('✅ TODAS AS TABELAS EXISTEM!');
    console.log('   Safety Operacional está pronto para uso.\n');
  } else {
    console.log('❌ ALGUMAS TABELAS NÃO EXISTEM!');
    console.log('\n📋 Execute este SQL no Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new\n');
    console.log('📄 Arquivo: apply_pricing_safety_migrations.sql');
    console.log('   (Contém TODAS as tabelas de Safety + Pricing)\n');
  }
}

verificarTabelas();
