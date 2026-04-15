#!/usr/bin/env node
/**
 * Aplicar tabela emergency_delivery_log e testar envio real
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.VITE_RESEND_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 APLICAR E TESTAR ENTREGA REAL\n');

// ============================================
// 1. VERIFICAR/CRIAR TABELA
// ============================================

console.log('1️⃣ Verificando tabela emergency_delivery_log...');

const { data: tableCheck, error: tableError } = await supabase
  .from('emergency_delivery_log')
  .select('count')
  .limit(0);

if (tableError) {
  console.log('⚠️  Tabela não existe. Precisa ser criada manualmente.\n');
  console.log('📋 AÇÃO NECESSÁRIA:');
  console.log('   1. Abra o SQL Editor do Supabase Dashboard');
  console.log('   2. Cole o conteúdo de: CREATE_EMERGENCY_DELIVERY_LOG.sql');
  console.log('   3. Execute o SQL');
  console.log('   4. Execute este script novamente\n');
  process.exit(1);
} else {
  console.log('✅ Tabela emergency_delivery_log existe\n');
}

// ============================================
// 2. VERIFICAR RESEND API KEY
// ============================================

console.log('2️⃣ Verificando Resend API Key...');

if (!resendApiKey) {
  console.log('⚠️  VITE_RESEND_API_KEY não configurada');
  console.log('   Emails serão simulados (modo de desenvolvimento)\n');
  console.log('📋 Para envio real:');
  console.log('   1. Crie conta em: https://resend.com');
  console.log('   2. Gere API key em: https://resend.com/api-keys');
  console.log('   3. Adicione no .env: VITE_RESEND_API_KEY=re_...\n');
} else {
  console.log(`✅ Resend API Key configurada: ${resendApiKey.substring(0, 10)}...\n`);
}

// ============================================
// 3. TESTAR ENVIO DE EMAIL
// ============================================

console.log('3️⃣ Testando envio de email...\n');

const testEmail = 'test@example.com'; // Altere para seu email real

if (!resendApiKey) {
  console.log('⚠️  Pulando teste de envio (sem API key)\n');
} else {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Teste <onboarding@resend.dev>',
        to: [testEmail],
        subject: 'Teste de Envio - Emergency Delivery',
        html: '<h1>Teste de Envio</h1><p>Se você recebeu este email, o sistema de entrega está funcionando!</p>',
        text: 'Teste de Envio\n\nSe você recebeu este email, o sistema de entrega está funcionando!',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Erro ao enviar email de teste:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Erro: ${JSON.stringify(errorData, null, 2)}\n`);
    } else {
      const result = await response.json();
      console.log('✅ Email de teste enviado com sucesso!');
      console.log(`   Email ID: ${result.id}`);
      console.log(`   Para: ${testEmail}\n`);
    }
  } catch (error) {
    console.log('❌ Erro ao testar envio:', error.message, '\n');
  }
}

// ============================================
// 4. TESTAR PERSISTÊNCIA DE LOG
// ============================================

console.log('4️⃣ Testando persistência de log...\n');

const testLogData = {
  alert_id: '00000000-0000-0000-0000-000000000001',
  contact_id: '00000000-0000-0000-0000-000000000002',
  channel: 'email',
  status: 'sent',
  target: testEmail,
  metadata: {
    test: true,
    timestamp: new Date().toISOString(),
  },
  created_at: new Date().toISOString(),
  delivered_at: new Date().toISOString(),
};

const { data: logData, error: logError } = await supabase
  .from('emergency_delivery_log')
  .insert(testLogData)
  .select()
  .single();

if (logError) {
  console.log('❌ Erro ao persistir log:', logError.message);
  console.log('   (Pode ser foreign key - IDs de teste não existem)\n');
} else {
  console.log('✅ Log persistido com sucesso!');
  console.log(`   Log ID: ${logData.id}`);
  console.log(`   Status: ${logData.status}`);
  console.log(`   Canal: ${logData.channel}\n`);
  
  // Limpar log de teste
  await supabase
    .from('emergency_delivery_log')
    .delete()
    .eq('id', logData.id);
  
  console.log('✅ Log de teste removido\n');
}

// ============================================
// RESUMO FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

const checks = [
  { name: 'Tabela emergency_delivery_log', status: !tableError },
  { name: 'Resend API Key configurada', status: !!resendApiKey },
  { name: 'Persistência de log', status: !logError },
];

checks.forEach(check => {
  console.log(`${check.status ? '✅' : '⚠️ '} ${check.name}`);
});

console.log('\n📧 PRÓXIMOS PASSOS:\n');

if (!resendApiKey) {
  console.log('1. Configure VITE_RESEND_API_KEY no .env para envio real');
  console.log('2. Teste com email real alterando testEmail no script');
} else {
  console.log('✅ Sistema pronto para envio real de emails!');
  console.log('✅ Logs de entrega serão persistidos automaticamente');
}

console.log('\n═══════════════════════════════════════════════════════\n');
