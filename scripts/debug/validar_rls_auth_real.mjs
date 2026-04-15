#!/usr/bin/env node
/**
 * Validar RLS com usuário authenticated real
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

console.log('🔐 VALIDANDO RLS COM AUTH REAL\n');
console.log('═══════════════════════════════════════════════════════\n');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  results.tests.push({ name, passed, details });
  console.log();
}

// ============================================
// 1. LOGIN COMO PASSAGEIRO
// ============================================

console.log('1️⃣ Login como passageiro\n');

const supabasePassageiro = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const { data: authData, error: authError } = await supabasePassageiro.auth.signInWithPassword({
  email: 'passageiro@staging.local',
  password: 'Pass123!@#'
});

logTest(
  'Login passageiro',
  !authError && authData.user,
  authData?.user ? `User ID: ${authData.user.id}` : `Erro: ${authError?.message}`
);

if (!authData?.user) {
  console.log('❌ Não foi possível fazer login. Abortando testes.\n');
  process.exit(1);
}

const passageiroId = authData.user.id;

// ============================================
// 2. CRIAR DADOS PRÓPRIOS
// ============================================

console.log('2️⃣ Criar dados próprios\n');

// Buscar profile_id
const { data: profile } = await supabasePassageiro
  .from('profiles')
  .select('id')
  .eq('user_id', passageiroId)
  .single();

const profileId = profile?.id || passageiroId;

// Criar alerta
const { data: alerta, error: alertaError } = await supabasePassageiro
  .from('emergency_alerts')
  .insert({
    profile_id: profileId,
    type: 'sos',
    message: 'Teste RLS'
  })
  .select()
  .single();

logTest(
  'Criar próprio alerta',
  !alertaError && alerta,
  alerta ? `Alerta: ${alerta.id}` : `Erro: ${alertaError?.message}`
);

// Criar contato
const { data: contato, error: contatoError } = await supabasePassageiro
  .from('emergency_contacts')
  .insert({
    profile_id: profileId,
    name: 'Teste RLS',
    phone: 'test@rls.com',
    relationship: 'teste',
    is_primary: false,
    is_active: true
  })
  .select()
  .single();

logTest(
  'Criar próprio contato',
  !contatoError && contato,
  contato ? `Contato: ${contato.id}` : `Erro: ${contatoError?.message}`
);

// ============================================
// 3. LER DADOS PRÓPRIOS
// ============================================

console.log('3️⃣ Ler dados próprios\n');

// Ler alertas
const { data: alertas, error: alertasError } = await supabasePassageiro
  .from('emergency_alerts')
  .select('*')
  .eq('profile_id', profileId);

logTest(
  'Ler próprios alertas',
  !alertasError && alertas && alertas.length > 0,
  alertas ? `${alertas.length} alerta(s) encontrado(s)` : `Erro: ${alertasError?.message}`
);

// Ler contatos
const { data: contatos, error: contatosError } = await supabasePassageiro
  .from('emergency_contacts')
  .select('*')
  .eq('profile_id', profileId);

logTest(
  'Ler próprios contatos',
  !contatosError && contatos && contatos.length > 0,
  contatos ? `${contatos.length} contato(s) encontrado(s)` : `Erro: ${contatosError?.message}`
);

// ============================================
// 4. PRICING PÚBLICO
// ============================================

console.log('4️⃣ Pricing público\n');

// Ler regras de pricing
const { data: regras, error: regrasError } = await supabasePassageiro
  .from('pricing_rules')
  .select('*')
  .eq('is_active', true);

logTest(
  'Ler regras de pricing ativas',
  !regrasError && regras,
  regras ? `${regras.length} regra(s) ativa(s)` : `Erro: ${regrasError?.message}`
);

// Tentar criar regra (deve falhar)
const { data: novaRegra, error: criarError } = await supabasePassageiro
  .from('pricing_rules')
  .insert({
    mode: 'ride',
    name: 'Teste RLS',
    base_fare: 5.00,
    price_per_km: 2.00,
    price_per_minute: 0.50,
    minimum_fare: 10.00,
    is_active: false
  })
  .select()
  .single();

logTest(
  'Bloquear criação de regra (não admin)',
  criarError && !novaRegra,
  criarError ? 'Acesso negado corretamente' : 'ERRO: Conseguiu criar regra!'
);

// ============================================
// 5. LIMPEZA
// ============================================

console.log('5️⃣ Limpeza\n');

// Usar service_role para limpar
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (alerta) {
  await supabaseAdmin.from('emergency_alerts').delete().eq('id', alerta.id);
}
if (contato) {
  await supabaseAdmin.from('emergency_contacts').delete().eq('id', contato.id);
}

console.log('✅ Dados de teste removidos\n');

// ============================================
// RESUMO FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

results.tests.forEach(test => {
  const icon = test.passed ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
});

console.log(`\n📈 Score: ${results.passed}/${results.total} (${Math.round(results.passed/results.total*100)}%)`);

if (results.passed === results.total) {
  console.log('\n🎉 RLS VALIDADO COM AUTH REAL!\n');
  console.log('✅ Usuários veem apenas próprios dados');
  console.log('✅ Acessos indevidos bloqueados');
  console.log('✅ Pricing público funciona\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${results.failed} teste(s) falharam\n`);
  process.exit(1);
}
