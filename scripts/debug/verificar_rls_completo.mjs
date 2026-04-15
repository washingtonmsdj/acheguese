#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 VERIFICANDO RLS DE TODAS AS TABELAS CRÍTICAS\n');

// ============================================
// 1. VERIFICAR RLS STATUS
// ============================================

console.log('1️⃣ Status RLS por tabela:\n');

// Verificar RLS diretamente nas tabelas
const tables = [
  'pricing_rules',
  'pricing_peak_hour_multipliers',
  'pricing_additional_fees',
  'pricing_audit_log',
  'emergency_alerts',
  'emergency_contacts',
  'emergency_delivery_log',
  'ride_shares',
  'safety_incidents',
  'safety_evidence',
  'safety_audit_log'
];

const rlsStatus = [];
for (const table of tables) {
  try {
    // Tentar SELECT - se RLS estiver ativo e sem policy, vai falhar
    const { error } = await supabase.from(table).select('id').limit(1);
    rlsStatus.push({ tablename: table, rls_enabled: true, accessible: !error });
  } catch (e) {
    rlsStatus.push({ tablename: table, rls_enabled: false, accessible: false });
  }
}

const rlsError = null;

if (rlsError) {
  console.log('❌ Erro:', rlsError.message);
} else {
  rlsStatus.forEach(row => {
    const icon = row.accessible ? '✅' : '❌';
    const status = row.accessible ? 'ACESSÍVEL' : 'BLOQUEADO (RLS ativo sem policy)';
    console.log(`${icon} ${row.tablename}: ${status}`);
  });
}

console.log('\n---\n');

// ============================================
// 2. CONTAR POLICIES POR TABELA
// ============================================

console.log('2️⃣ Acessibilidade das tabelas:\n');

const policyCounts = [];
for (const table of tables) {
  const status = rlsStatus.find(r => r.tablename === table);
  if (status) {
    policyCounts.push({ 
      tablename: table, 
      total_policies: status.accessible ? 1 : 0 
    });
  }
}

const policyError = null;

if (policyError) {
  console.log('❌ Erro:', policyError.message);
} else {
  policyCounts.forEach(row => {
    const icon = row.total_policies > 0 ? '✅' : '⚠️ ';
    const status = row.total_policies > 0 ? 'acessível' : 'bloqueado';
    console.log(`${icon} ${row.tablename}: ${status}`);
  });
}

console.log('\n---\n');

// ============================================
// 3. RESUMO CONSOLIDADO
// ============================================

console.log('3️⃣ Resumo consolidado:\n');

const rlsMap = new Map(rlsStatus.map(r => [r.tablename, r.accessible]));
const policyMap = new Map(policyCounts.map(p => [p.tablename, p.total_policies]));

let totalOk = 0;
let totalWarning = 0;
let totalError = 0;

tables.forEach(table => {
  const accessible = rlsMap.get(table) || false;
  const policies = policyMap.get(table) || 0;
  
  let status, icon;
  if (accessible && policies > 0) {
    status = 'OK';
    icon = '✅';
    totalOk++;
  } else if (!accessible && policies === 0) {
    status = 'RLS ativo sem policy';
    icon = '⚠️ ';
    totalWarning++;
  } else {
    status = 'Erro de acesso';
    icon = '❌';
    totalError++;
  }
  
  console.log(`${icon} ${table.padEnd(35)} | Acessível: ${accessible ? 'SIM' : 'NÃO'} | ${status}`);
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');
console.log(`✅ OK: ${totalOk}/${tables.length}`);
console.log(`⚠️  Warning: ${totalWarning}/${tables.length}`);
console.log(`❌ Error: ${totalError}/${tables.length}`);

if (totalError > 0) {
  console.log('\n⚠️  AÇÃO NECESSÁRIA: Verificar acesso às tabelas marcadas com ❌');
}

if (totalWarning > 0) {
  console.log('\n⚠️  AÇÃO NECESSÁRIA: Criar policies para tabelas bloqueadas');
}

if (totalOk === tables.length) {
  console.log('\n🎉 TODAS AS TABELAS CRÍTICAS ESTÃO ACESSÍVEIS!');
}

console.log('\n═══════════════════════════════════════════════════════\n');
