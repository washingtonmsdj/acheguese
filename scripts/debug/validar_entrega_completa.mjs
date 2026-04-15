#!/usr/bin/env node
/**
 * Validação Completa - Entrega Externa
 * 
 * Valida:
 * 1. Edge Function deployada
 * 2. Secret configurado
 * 3. Tabela emergency_delivery_log
 * 4. Teste de envio real
 * 5. Teste de falha
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

console.log('🔍 VALIDAÇÃO COMPLETA - ENTREGA EXTERNA\n');

// ============================================
// 1. VALIDAR TABELA
// ============================================

console.log('1️⃣ Validando tabela emergency_delivery_log...');

const { data: tableCheck, error: tableError } = await supabase
  .from('emergency_delivery_log')
  .select('count')
  .limit(0);

if (tableError) {
  console.log('❌ Tabela não existe:', tableError.message, '\n');
  process.exit(1);
} else {
  console.log('✅ Tabela emergency_delivery_log existe\n');
}

// ============================================
// 2. VALIDAR EDGE FUNCTION
// ============================================

console.log('2️⃣ Testando Edge Function...\n');

const testEmail = 'test@example.com'; // Altere para seu email

console.log(`   Enviando para: ${testEmail}`);

const { data: functionData, error: functionError } = await supabase.functions.invoke(
  'send-emergency-email',
  {
    body: {
      contactId: `test-${Date.now()}`,
      contactName: 'Teste Validação',
      contactEmail: testEmail,
      alertId: `alert-${Date.now()}`,
      alertType: 'sos',
      alertCreatedAt: new Date().toISOString(),
      userName: 'Sistema de Validação',
      userPhone: '11999999999',
      alertDescription: 'Teste de validação completa',
    },
  }
);

if (functionError) {
  console.log('❌ Erro ao chamar Edge Function:', functionError.message);
  console.log('   Verifique:');
  console.log('   1. Edge Function deployada: supabase functions list');
  console.log('   2. Secret configurado: supabase secrets list');
  console.log('   3. Logs: supabase functions logs send-emergency-email\n');
} else {
  console.log('✅ Edge Function respondeu');
  console.log(`   Success: ${functionData.success}`);
  console.log(`   Status: ${functionData.status}`);
  
  if (functionData.error) {
    console.log(`   Error: ${functionData.error}`);
  }
  
  if (functionData.metadata?.emailId) {
    console.log(`   Email ID: ${functionData.metadata.emailId}`);
  }
  
  console.log();
}

// ============================================
// 3. VERIFICAR LOGS DE ENTREGA
// ============================================

console.log('3️⃣ Verificando logs de entrega...');

const { data: logs, error: logsError, count } = await supabase
  .from('emergency_delivery_log')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .limit(5);

if (logsError) {
  console.log('❌ Erro ao buscar logs:', logsError.message, '\n');
} else {
  console.log(`📊 Total de logs: ${count || 0}`);
  
  if (logs && logs.length > 0) {
    console.log('\n📋 Últimos logs:');
    logs.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.channel} → ${log.target}`);
      console.log(`      Status: ${log.status}`);
      console.log(`      Created: ${new Date(log.created_at).toLocaleString('pt-BR')}`);
      if (log.error_message) {
        console.log(`      Error: ${log.error_message}`);
      }
      if (log.delivered_at) {
        console.log(`      Delivered: ${new Date(log.delivered_at).toLocaleString('pt-BR')}`);
      }
      console.log();
    });
  } else {
    console.log('   Nenhum log encontrado ainda\n');
  }
}

// ============================================
// 4. TESTE DE FALHA
// ============================================

console.log('4️⃣ Testando cenário de falha...\n');

const { data: failData, error: failError } = await supabase.functions.invoke(
  'send-emergency-email',
  {
    body: {
      contactId: `fail-test-${Date.now()}`,
      contactName: 'Teste Falha',
      contactEmail: 'invalid-email', // Email inválido
      alertId: `alert-fail-${Date.now()}`,
      alertType: 'sos',
      alertCreatedAt: new Date().toISOString(),
      userName: 'Teste',
      userPhone: '11999999999',
    },
  }
);

if (failError) {
  console.log('✅ Erro capturado corretamente:', failError.message, '\n');
} else if (failData && !failData.success) {
  console.log('✅ Falha tratada corretamente');
  console.log(`   Status: ${failData.status}`);
  console.log(`   Error: ${failData.error}\n`);
} else {
  console.log('⚠️  Falha não foi detectada (email inválido deveria falhar)\n');
}

// ============================================
// RESUMO FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

const checks = [
  { name: 'Tabela emergency_delivery_log', status: !tableError },
  { name: 'Edge Function responde', status: !functionError },
  { name: 'Envio bem-sucedido', status: functionData?.success === true },
  { name: 'Logs de entrega', status: !logsError },
  { name: 'Tratamento de falha', status: failData?.success === false || !!failError },
];

checks.forEach(check => {
  console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
});

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.status).length;

console.log(`\n📈 Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ENTREGA EXTERNA: 100% FUNCIONAL!\n');
  console.log('✅ Edge Function deployada e funcionando');
  console.log('✅ Emails sendo enviados');
  console.log('✅ Logs sendo persistidos');
  console.log('✅ Falhas sendo tratadas\n');
} else {
  console.log('\n⚠️  Pendências encontradas. Revisar itens acima.\n');
  
  if (!functionData?.success) {
    console.log('📋 AÇÕES NECESSÁRIAS:');
    console.log('   1. Verificar deploy: supabase functions list');
    console.log('   2. Verificar secret: supabase secrets list');
    console.log('   3. Ver logs: supabase functions logs send-emergency-email');
    console.log('   4. Testar manualmente: bash deploy_e_testar_edge_function.sh\n');
  }
}

console.log('═══════════════════════════════════════════════════════\n');
