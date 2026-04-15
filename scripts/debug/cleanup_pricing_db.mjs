#!/usr/bin/env node

/**
 * Script de Limpeza do Banco de Dados - Pricing
 * Remove regras duplicadas e de teste
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧹 LIMPEZA DO BANCO DE DADOS - PRICING\n');
console.log('=' .repeat(60));

async function main() {
  // Buscar perfil para usar como updated_by
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (!profile) {
    console.error('❌ Nenhum perfil encontrado no banco');
    process.exit(1);
  }
  
  const adminUserId = profile.id;
  console.log(`\nℹ️  Usando perfil: ${adminUserId}\n`);
  
  // 1. Desativar "Corrida Conflitante"
  console.log('1️⃣  Desativando "Corrida Conflitante"...');
  
  const { data: conflictRule, error: findError } = await supabase
    .from('pricing_rules')
    .select('id, name')
    .eq('name', 'Corrida Conflitante')
    .single();
  
  if (findError || !conflictRule) {
    console.log('   ℹ️  Regra "Corrida Conflitante" não encontrada (já removida?)');
  } else {
    const { error: updateError } = await supabase
      .from('pricing_rules')
      .update({
        is_active: false,
        updated_by: adminUserId
      })
      .eq('id', conflictRule.id);
    
    if (updateError) {
      console.error('   ❌ Erro:', updateError.message);
    } else {
      console.log('   ✅ Regra desativada com sucesso');
    }
  }
  
  // 2. Remover regras de teste
  console.log('\n2️⃣  Removendo regras de teste...');
  
  const { data: testRules } = await supabase
    .from('pricing_rules')
    .select('id, name')
    .like('name', 'Teste%');
  
  if (!testRules || testRules.length === 0) {
    console.log('   ℹ️  Nenhuma regra de teste encontrada');
  } else {
    console.log(`   Encontradas ${testRules.length} regras de teste:`);
    testRules.forEach(r => console.log(`   - ${r.name}`));
    
    const { error: deleteError } = await supabase
      .from('pricing_rules')
      .delete()
      .like('name', 'Teste%');
    
    if (deleteError) {
      console.error('   ❌ Erro:', deleteError.message);
    } else {
      console.log(`   ✅ ${testRules.length} regras removidas`);
    }
  }
  
  // 3. Verificar estado final
  console.log('\n3️⃣  Verificando estado final...\n');
  
  const { data: activeRules } = await supabase
    .from('pricing_rules')
    .select('mode, name, is_active')
    .eq('is_active', true)
    .order('mode')
    .order('name');
  
  if (!activeRules || activeRules.length === 0) {
    console.log('   ⚠️  Nenhuma regra ativa encontrada!');
  } else {
    console.log(`   Total de regras ativas: ${activeRules.length}\n`);
    
    const byMode = {};
    activeRules.forEach(rule => {
      if (!byMode[rule.mode]) byMode[rule.mode] = [];
      byMode[rule.mode].push(rule.name);
    });
    
    Object.entries(byMode).forEach(([mode, rules]) => {
      const icon = rules.length === 1 ? '✅' : '⚠️';
      console.log(`   ${icon} ${mode}: ${rules.length} regra(s) ativa(s)`);
      rules.forEach(name => console.log(`      - ${name}`));
    });
    
    // Verificar se há conflitos
    const conflicts = Object.entries(byMode).filter(([_, rules]) => rules.length > 1);
    
    if (conflicts.length > 0) {
      console.log('\n   ⚠️  ATENÇÃO: Ainda existem conflitos!');
      conflicts.forEach(([mode, rules]) => {
        console.log(`      ${mode}: ${rules.length} regras ativas`);
      });
    } else {
      console.log('\n   ✅ Nenhum conflito detectado');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ LIMPEZA CONCLUÍDA\n');
}

main().catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});
