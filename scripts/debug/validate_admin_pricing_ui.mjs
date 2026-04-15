#!/usr/bin/env node

/**
 * Validação da UI do Admin Pricing via API
 * Simula ações do usuário testando endpoints diretamente
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 VALIDAÇÃO DA UI - ADMIN PRICING\n');
console.log('=' .repeat(60));
console.log('\nℹ️  Validando via API (simulando ações da UI)\n');

let testUserId = null;
let testRuleId = null;
const TEST_RULE_NAME = `Teste UI ${Date.now()}`;

// ============================================
// 1. VALIDAR LISTAGEM
// ============================================
async function validarListagem() {
  console.log('1️⃣  VALIDAR LISTAGEM\n');
  
  try {
    // Simular o que usePricingRules faz
    const { data, error, count } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        peak_hour_multipliers:pricing_peak_hour_multipliers(*),
        additional_fees:pricing_additional_fees(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`   Total de regras: ${count}`);
    
    // Agrupar por modo
    const byMode = {};
    data?.forEach(rule => {
      if (!byMode[rule.mode]) byMode[rule.mode] = [];
      byMode[rule.mode].push(rule);
    });
    
    console.log('\n   Regras por modalidade:');
    Object.entries(byMode).forEach(([mode, rules]) => {
      const activeCount = rules.filter(r => r.is_active).length;
      console.log(`   - ${mode}: ${rules.length} total (${activeCount} ativas)`);
    });
    
    // Verificar se há pelo menos 4 regras ativas
    const activeRules = data?.filter(r => r.is_active) || [];
    if (activeRules.length < 4) {
      console.log(`\n   ⚠️  Apenas ${activeRules.length} regras ativas (esperado: 4)`);
      return false;
    }
    
    console.log('\n   ✅ Listagem OK - Dados carregam corretamente');
    return true;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// 2. VALIDAR CRIAÇÃO
// ============================================
async function validarCriacao() {
  console.log('\n2️⃣  VALIDAR CRIAÇÃO\n');
  
  try {
    // Buscar perfil para usar como created_by
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    if (!profile) {
      console.log('   ⚠️  Nenhum perfil encontrado');
      return false;
    }
    
    testUserId = profile.id;
    console.log(`   Usando perfil: ${testUserId}`);
    
    // Simular o que PricingRuleDialog faz ao criar
    const newRule = {
      mode: 'ride',
      name: TEST_RULE_NAME,
      base_fare: 5.00,
      price_per_km: 2.50,
      price_per_minute: 0.50,
      minimum_fare: 8.00,
      is_active: false, // Inativa para não conflitar
      created_by: testUserId,
      updated_by: testUserId
    };
    
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert(newRule)
      .select()
      .single();
    
    if (error) throw error;
    
    testRuleId = data.id;
    console.log(`\n   ✅ Regra criada: ${data.name}`);
    console.log(`   ID: ${data.id}`);
    
    // Verificar se auditoria registrou
    const { data: audit } = await supabase
      .from('pricing_audit_log')
      .select('*')
      .eq('entity_id', data.id)
      .eq('action', 'rule_created')
      .single();
    
    if (audit) {
      console.log('   ✅ Auditoria registrada');
    } else {
      console.log('   ⚠️  Auditoria não encontrada');
    }
    
    return true;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// 3. VALIDAR EDIÇÃO
// ============================================
async function validarEdicao() {
  console.log('\n3️⃣  VALIDAR EDIÇÃO\n');
  
  if (!testRuleId) {
    console.log('   ⚠️  Regra de teste não criada, pulando');
    return false;
  }
  
  try {
    // Simular o que PricingRuleDialog faz ao editar
    const updates = {
      name: `${TEST_RULE_NAME} Editado`,
      base_fare: 6.00,
      updated_by: testUserId
    };
    
    const { data, error } = await supabase
      .from('pricing_rules')
      .update(updates)
      .eq('id', testRuleId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`   ✅ Regra editada: ${data.name}`);
    console.log(`   Nova tarifa base: R$ ${data.base_fare}`);
    
    // Verificar se auditoria registrou
    const { data: audit } = await supabase
      .from('pricing_audit_log')
      .select('*')
      .eq('entity_id', testRuleId)
      .eq('action', 'rule_updated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (audit) {
      console.log('   ✅ Auditoria registrada');
    } else {
      console.log('   ⚠️  Auditoria não encontrada');
    }
    
    return true;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// 4. VALIDAR ATIVAÇÃO/DESATIVAÇÃO
// ============================================
async function validarAtivacao() {
  console.log('\n4️⃣  VALIDAR ATIVAÇÃO/DESATIVAÇÃO\n');
  
  if (!testRuleId) {
    console.log('   ⚠️  Regra de teste não criada, pulando');
    return false;
  }
  
  try {
    // Tentar ativar (deve falhar por conflito)
    console.log('   Tentando ativar regra (deve falhar por conflito)...');
    
    const { error: activateError } = await supabase
      .from('pricing_rules')
      .update({
        is_active: true,
        updated_by: testUserId
      })
      .eq('id', testRuleId);
    
    if (activateError) {
      if (activateError.message.includes('Conflito') || activateError.message.includes('conflito')) {
        console.log('   ✅ Conflito detectado corretamente');
        console.log(`   Mensagem: ${activateError.message}`);
        return true;
      } else {
        console.log(`   ⚠️  Erro inesperado: ${activateError.message}`);
        return false;
      }
    }
    
    // Se não deu erro, algo está errado
    console.log('   ❌ Conflito NÃO foi detectado (trigger pode estar inativo)');
    
    // Desativar novamente
    await supabase
      .from('pricing_rules')
      .update({
        is_active: false,
        updated_by: testUserId
      })
      .eq('id', testRuleId);
    
    return false;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// 5. VALIDAR CONFLITO NA UI
// ============================================
async function validarConflito() {
  console.log('\n5️⃣  VALIDAR CONFLITO NA UI\n');
  
  try {
    // Tentar criar segunda regra ativa para ride
    console.log('   Tentando criar segunda regra ativa para ride...');
    
    const { error } = await supabase
      .from('pricing_rules')
      .insert({
        mode: 'ride',
        name: 'Teste Conflito UI',
        base_fare: 5.00,
        price_per_km: 2.50,
        price_per_minute: 0.50,
        minimum_fare: 8.00,
        is_active: true,
        created_by: testUserId,
        updated_by: testUserId
      });
    
    if (error) {
      if (error.message.includes('Conflito') || error.message.includes('conflito')) {
        console.log('   ✅ Conflito detectado na criação');
        console.log(`   Mensagem: ${error.message}`);
        return true;
      } else {
        console.log(`   ⚠️  Erro inesperado: ${error.message}`);
        return false;
      }
    }
    
    // Se não deu erro, limpar e reportar problema
    console.log('   ❌ Conflito NÃO foi detectado');
    await supabase
      .from('pricing_rules')
      .delete()
      .eq('name', 'Teste Conflito UI');
    
    return false;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// 6. VALIDAR AUDITORIA NA UI
// ============================================
async function validarAuditoria() {
  console.log('\n6️⃣  VALIDAR AUDITORIA NA UI\n');
  
  try {
    // Simular o que usePricingAuditLog faz
    const { data, error, count } = await supabase
      .from('pricing_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    console.log(`   Total de registros: ${count}`);
    
    if (data && data.length > 0) {
      console.log('\n   Últimos 5 registros:');
      data.slice(0, 5).forEach(log => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        console.log(`   - ${log.action} (${log.entity_type}) - ${date}`);
      });
    }
    
    console.log('\n   ✅ Auditoria carrega corretamente');
    return true;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// 7. LIMPAR REGRA DE TESTE
// ============================================
async function limparTeste() {
  console.log('\n7️⃣  LIMPAR REGRA DE TESTE\n');
  
  if (!testRuleId) {
    console.log('   ℹ️  Nenhuma regra de teste para limpar');
    return true;
  }
  
  try {
    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', testRuleId);
    
    if (error) throw error;
    
    console.log('   ✅ Regra de teste removida');
    return true;
    
  } catch (error) {
    console.error('   ❌ Erro:', error.message);
    return false;
  }
}

// ============================================
// EXECUTAR TODAS AS VALIDAÇÕES
// ============================================
async function main() {
  const results = {
    listagem: await validarListagem(),
    criacao: await validarCriacao(),
    edicao: await validarEdicao(),
    ativacao: await validarAtivacao(),
    conflito: await validarConflito(),
    auditoria: await validarAuditoria(),
  };
  
  // Limpar sempre, independente do resultado
  await limparTeste();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DA VALIDAÇÃO\n');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ TODAS AS VALIDAÇÕES DA UI PASSARAM!\n');
    console.log('Admin pricing está operacional.\n');
    process.exit(0);
  } else {
    console.log('\n❌ ALGUMAS VALIDAÇÕES FALHARAM\n');
    console.log('Admin pricing NÃO está completamente operacional.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});
