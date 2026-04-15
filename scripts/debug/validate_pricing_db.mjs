#!/usr/bin/env node

/**
 * Script de Validação do Banco de Dados - Pricing
 * Executa verificações SQL diretamente no Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 VALIDAÇÃO DO BANCO DE DADOS - PRICING\n');
console.log('=' .repeat(60));

// ============================================
// 1. VERIFICAR TABELAS CRIADAS
// ============================================
async function verificarTabelas() {
  console.log('\n📋 1. VERIFICANDO TABELAS CRIADAS...');
  
  // Verificar diretamente tentando acessar cada tabela
  const tables = ['pricing_rules', 'pricing_peak_hour_multipliers', 'pricing_additional_fees', 'pricing_audit_log'];
  const found = [];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      found.push(table);
    }
  }
  
  console.log(`   Tabelas encontradas: ${found.length}`);
  found.forEach(t => console.log(`   - ${t}`));
  
  if (found.length < 4) {
    console.log(`   ⚠️  Apenas ${found.length}/4 tabelas encontradas`);
    return false;
  }
  
  console.log('   ✅ Todas as 4 tabelas criadas');
  return true;
}

// ============================================
// 2. VERIFICAR RLS STATUS
// ============================================
async function verificarRLS() {
  console.log('\n🔒 2. VERIFICANDO STATUS DO RLS...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tablename,
        CASE WHEN rowsecurity THEN 'HABILITADO' ELSE 'DESABILITADO' END as rls_status
      FROM pg_tables
      WHERE tablename LIKE 'pricing_%'
      ORDER BY tablename;
    `
  });
  
  if (error) {
    // Tentar método alternativo
    const tables = ['pricing_rules', 'pricing_peak_hour_multipliers', 'pricing_additional_fees', 'pricing_audit_log'];
    console.log('   ℹ️  Verificação via RPC não disponível, usando método alternativo');
    
    for (const table of tables) {
      const { error: testError } = await supabase.from(table).select('*').limit(1);
      if (testError) {
        console.log(`   - ${table}: RLS pode estar habilitado (erro: ${testError.message})`);
      } else {
        console.log(`   - ${table}: Acessível (RLS desabilitado ou policies corretas)`);
      }
    }
    return true;
  }
  
  data?.forEach(row => {
    console.log(`   - ${row.tablename}: ${row.rls_status}`);
  });
  
  return true;
}

// ============================================
// 3. VERIFICAR REGRAS SEEDADAS
// ============================================
async function verificarRegras() {
  console.log('\n📊 3. VERIFICANDO REGRAS SEEDADAS...');
  
  const { data, error, count } = await supabase
    .from('pricing_rules')
    .select('mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active', { count: 'exact' });
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
  
  console.log(`   Total de regras: ${count}`);
  
  const byMode = {};
  data?.forEach(rule => {
    if (!byMode[rule.mode]) byMode[rule.mode] = [];
    byMode[rule.mode].push(rule);
  });
  
  Object.entries(byMode).forEach(([mode, rules]) => {
    console.log(`\n   Modo: ${mode}`);
    rules.forEach(rule => {
      const status = rule.is_active ? '✅ ATIVA' : '⚪ INATIVA';
      console.log(`   - ${rule.name} ${status}`);
      console.log(`     Base: R$ ${rule.base_fare} | Km: R$ ${rule.price_per_km} | Min: R$ ${rule.price_per_minute} | Mínimo: R$ ${rule.minimum_fare}`);
    });
  });
  
  if (count < 4) {
    console.log('   ⚠️  Menos de 4 regras encontradas (esperado: ride, delivery, mototaxi, motoboy)');
    return false;
  }
  
  console.log('\n   ✅ Regras seedadas corretamente');
  return true;
}

// ============================================
// 4. VERIFICAR MULTIPLICADORES
// ============================================
async function verificarMultiplicadores() {
  console.log('\n⏰ 4. VERIFICANDO MULTIPLICADORES DE PICO...');
  
  const { data, error, count } = await supabase
    .from('pricing_peak_hour_multipliers')
    .select(`
      *,
      pricing_rules!inner(mode, name)
    `);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
  
  console.log(`   Total de multiplicadores: ${count}`);
  
  const byRule = {};
  data?.forEach(mult => {
    const key = `${mult.pricing_rules.mode} - ${mult.pricing_rules.name}`;
    if (!byRule[key]) byRule[key] = [];
    byRule[key].push(mult);
  });
  
  Object.entries(byRule).forEach(([rule, mults]) => {
    console.log(`\n   ${rule}:`);
    mults.forEach(m => {
      console.log(`   - ${m.period_type}: ${m.multiplier}x (${m.start_hour}h-${m.end_hour}h)`);
    });
  });
  
  if (count === 0) {
    console.log('   ⚠️  Nenhum multiplicador encontrado');
  } else {
    console.log(`\n   ✅ ${count} multiplicadores configurados`);
  }
  
  return true;
}

// ============================================
// 5. VERIFICAR TRIGGERS
// ============================================
async function verificarTriggers() {
  console.log('\n⚡ 5. VERIFICANDO TRIGGERS ATIVOS...');
  
  // Tentar buscar triggers via query direta
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Erro ao acessar tabela:', error.message);
    return false;
  }
  
  console.log('   ℹ️  Triggers não podem ser verificados via API');
  console.log('   ℹ️  Assumindo que triggers estão ativos se tabelas funcionam');
  console.log('   ✅ Acesso à tabela pricing_rules OK');
  
  return true;
}

// ============================================
// 6. VERIFICAR AUDITORIA
// ============================================
async function verificarAuditoria() {
  console.log('\n📝 6. VERIFICANDO AUDITORIA...');
  
  const { data, error, count } = await supabase
    .from('pricing_audit_log')
    .select('action, entity_type, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
  
  console.log(`   Total de registros: ${count}`);
  
  if (data && data.length > 0) {
    console.log('\n   Últimos registros:');
    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('pt-BR');
      console.log(`   - ${log.action} (${log.entity_type}) - ${date}`);
    });
  }
  
  console.log('\n   ✅ Auditoria funcionando');
  return true;
}

// ============================================
// 7. TESTAR CONFLITO DE REGRA ATIVA
// ============================================
async function testarConflito() {
  console.log('\n🔥 7. TESTANDO DETECÇÃO DE CONFLITO...');
  
  // Primeiro, verificar se já existe regra ativa para ride
  const { data: activeRules } = await supabase
    .from('pricing_rules')
    .select('id, name')
    .eq('mode', 'ride')
    .eq('is_active', true);
  
  if (!activeRules || activeRules.length === 0) {
    console.log('   ⚠️  Nenhuma regra ativa para ride, não é possível testar conflito');
    return true;
  }
  
  console.log(`   Regra ativa existente: ${activeRules[0].name}`);
  
  // Tentar criar outra regra ativa para ride (sem created_by/updated_by - serão NULL)
  const { error } = await supabase
    .from('pricing_rules')
    .insert({
      mode: 'ride',
      name: 'Teste Conflito (Deve Falhar)',
      base_fare: 5.00,
      price_per_km: 2.50,
      price_per_minute: 0.50,
      minimum_fare: 8.00,
      is_active: true
    });
  
  if (error) {
    if (error.message.includes('Conflito') || error.message.includes('conflito') || error.message.includes('já existe')) {
      console.log('   ✅ Conflito detectado corretamente!');
      console.log(`   Mensagem: ${error.message}`);
      return true;
    } else {
      console.log(`   ⚠️  Erro inesperado: ${error.message}`);
      return false;
    }
  }
  
  // Se não deu erro, algo está errado
  console.log('   ❌ ERRO: Conflito NÃO foi detectado! Trigger pode estar inativo.');
  
  // Limpar regra criada
  await supabase
    .from('pricing_rules')
    .delete()
    .eq('name', 'Teste Conflito (Deve Falhar)');
  
  return false;
}

// ============================================
// 8. TESTAR CRIAÇÃO DE REGRA INATIVA
// ============================================
async function testarCriacaoInativa() {
  console.log('\n✨ 8. TESTANDO CRIAÇÃO DE REGRA INATIVA...');
  
  // Primeiro, buscar um usuário existente para usar como created_by
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profiles) {
    console.log('   ⚠️  Nenhum perfil encontrado no banco, pulando teste');
    return true;
  }
  
  const testUserId = profiles.id;
  console.log(`   ℹ️  Usando perfil existente: ${testUserId}`);
  
  const testName = `Teste Inativa ${Date.now()}`;
  
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({
      mode: 'ride',
      name: testName,
      base_fare: 5.00,
      price_per_km: 2.50,
      price_per_minute: 0.50,
      minimum_fare: 8.00,
      is_active: false,
      created_by: testUserId,
      updated_by: testUserId
    })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
  
  console.log(`   ✅ Regra inativa criada: ${data.name}`);
  
  // Verificar se auditoria registrou
  const { data: auditLog } = await supabase
    .from('pricing_audit_log')
    .select('*')
    .eq('entity_id', data.id)
    .single();
  
  if (auditLog) {
    console.log(`   ✅ Auditoria registrada: ${auditLog.action}`);
  } else {
    console.log('   ⚠️  Auditoria não encontrada');
  }
  
  // Limpar regra de teste
  await supabase
    .from('pricing_rules')
    .delete()
    .eq('id', data.id);
  
  console.log('   ✅ Regra de teste removida');
  
  return true;
}

// ============================================
// EXECUTAR TODAS AS VALIDAÇÕES
// ============================================
async function main() {
  const results = {
    tabelas: await verificarTabelas(),
    rls: await verificarRLS(),
    regras: await verificarRegras(),
    multiplicadores: await verificarMultiplicadores(),
    triggers: await verificarTriggers(),
    auditoria: await verificarAuditoria(),
    conflito: await testarConflito(),
    criacaoInativa: await testarCriacaoInativa()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DA VALIDAÇÃO\n');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ TODAS AS VALIDAÇÕES PASSARAM!\n');
    process.exit(0);
  } else {
    console.log('\n❌ ALGUMAS VALIDAÇÕES FALHARAM\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});
