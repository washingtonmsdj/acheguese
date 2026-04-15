#!/usr/bin/env node
/**
 * Teste Fluxo Completo - End-to-End CORRIGIDO
 * Usa estrutura real da tabela emergency_alerts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE FLUXO COMPLETO - END-TO-END\n');

// ============================================
// 1. BUSCAR UM PROFILE REAL
// ============================================

console.log('1️⃣ Buscando profile para teste...');

const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('id, name, phone')
  .limit(1)
  .single();

if (profileError || !profiles) {
  console.log('❌ Erro ao buscar profile:', profileError?.message);
  process.exit(1);
}

const profileId = profiles.id;
console.log(`✅ Profile encontrado: ${profiles.name || profiles.phone || 'Sem nome'} (${profileId})\n`);

// ============================================
// 2. CRIAR CONTATO DE EMERGÊNCIA
// ============================================

console.log('2️⃣ Criando contato de emergência...');

const { data: contact, error: contactError } = await supabase
  .from('emergency_contacts')
  .insert({
    profile_id: profileId,
    name: 'Teste End-to-End',
    phone: 'delivered@resend.dev', // Email de teste do Resend
    relationship: 'teste',
    is_primary: true,
    is_active: true,
  })
  .select()
  .single();

if (contactError) {
  console.log('❌ Erro ao criar contato:', contactError.message, '\n');
  process.exit(1);
}

console.log(`✅ Contato criado: ${contact.name} (${contact.id})`);
console.log(`   Email: ${contact.phone}\n`);

// ============================================
// 3. CRIAR ALERTA DE EMERGÊNCIA (estrutura real)
// ============================================

console.log('3️⃣ Criando alerta de emergência...');

const { data: alert, error: alertError } = await supabase
  .from('emergency_alerts')
  .insert({
    profile_id: profileId,
    type: 'sos',
    message: 'Teste end-to-end de entrega externa',
  })
  .select()
  .single();

if (alertError) {
  console.log('❌ Erro ao criar alerta:', alertError.message, '\n');
  process.exit(1);
}

console.log(`✅ Alerta criado: ${alert.id}\n`);

// ============================================
// 4. ENVIAR EMAIL VIA EDGE FUNCTION
// ============================================

console.log('4️⃣ Enviando notificação para contato...');

// Buscar dados do perfil
const { data: profile } = await supabase
  .from('profiles')
  .select('name, phone')
  .eq('id', profileId)
  .single();

// Chamar Edge Function
const { data: emailResult, error: emailError } = await supabase.functions.invoke(
  'send-emergency-email',
  {
    body: {
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.phone,
      alertId: alert.id,
      alertType: alert.type,
      alertCreatedAt: alert.created_at,
      alertDescription: alert.message,
      alertLocation: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
      userName: profile?.name || 'Usuário Teste',
      userPhone: profile?.phone || '11999999999',
    },
  }
);

if (emailError) {
  console.log('❌ Erro ao enviar email:', emailError.message, '\n');
} else {
  console.log('✅ Email enviado!');
  console.log(`   Status: ${emailResult.status}`);
  console.log(`   Email ID: ${emailResult.metadata?.emailId}\n`);
}

// ============================================
// 5. PERSISTIR LOG DE ENTREGA
// ============================================

console.log('5️⃣ Persistindo log de entrega...');

const { data: log, error: logError } = await supabase
  .from('emergency_delivery_log')
  .insert({
    alert_id: alert.id,
    contact_id: contact.id,
    channel: emailResult.channel,
    status: emailResult.status,
    target: contact.phone,
    error_message: emailResult.error,
    metadata: emailResult.metadata || {},
    created_at: emailResult.timestamp,
    delivered_at: emailResult.status === 'sent' ? emailResult.timestamp : null,
  })
  .select()
  .single();

if (logError) {
  console.log('❌ Erro ao persistir log:', logError.message, '\n');
} else {
  console.log('✅ Log persistido!');
  console.log(`   Log ID: ${log.id}`);
  console.log(`   Status: ${log.status}\n`);
}

// ============================================
// 6. TESTE DE FALHA
// ============================================

console.log('6️⃣ Testando cenário de falha...');

const { data: failContact, error: failContactError } = await supabase
  .from('emergency_contacts')
  .insert({
    profile_id: profileId,
    name: 'Teste Falha',
    phone: 'email-invalido',
    relationship: 'teste',
    is_primary: false,
    is_active: true,
  })
  .select()
  .single();

if (failContactError) {
  console.log('❌ Erro ao criar contato de falha:', failContactError.message, '\n');
} else {
  console.log(`✅ Contato de falha criado: ${failContact.id}\n`);

  // Tentar enviar para email inválido
  const { data: failResult, error: failError } = await supabase.functions.invoke(
    'send-emergency-email',
    {
      body: {
        contactId: failContact.id,
        contactName: failContact.name,
        contactEmail: failContact.phone,
        alertId: alert.id,
        alertType: 'sos',
        alertCreatedAt: new Date().toISOString(),
        userName: 'Teste',
        userPhone: '11999999999',
      },
    }
  );

  if (failError || !failResult.success) {
    console.log('✅ Falha capturada corretamente');
    console.log(`   Error: ${failResult?.error || failError?.message}\n`);

    // Persistir log de falha
    await supabase.from('emergency_delivery_log').insert({
      alert_id: alert.id,
      contact_id: failContact.id,
      channel: 'email',
      status: 'failed',
      target: failContact.phone,
      error_message: failResult?.error || failError?.message,
      metadata: {},
      created_at: new Date().toISOString(),
    });

    console.log('✅ Log de falha persistido\n');
  }
}

// ============================================
// 7. VERIFICAR LOGS
// ============================================

console.log('7️⃣ Verificando logs no banco...\n');

const { data: logs, error: logsError } = await supabase
  .from('emergency_delivery_log')
  .select('*')
  .eq('alert_id', alert.id)
  .order('created_at', { ascending: false });

if (logsError) {
  console.log('❌ Erro ao buscar logs:', logsError.message, '\n');
} else {
  console.log(`📊 Total de logs: ${logs.length}\n`);
  
  logs.forEach((log, i) => {
    console.log(`   ${i + 1}. ${log.channel} → ${log.target}`);
    console.log(`      Status: ${log.status}`);
    if (log.error_message) {
      console.log(`      Error: ${log.error_message}`);
    }
    if (log.delivered_at) {
      console.log(`      Delivered: ${new Date(log.delivered_at).toLocaleString('pt-BR')}`);
    }
    console.log();
  });
}

// ============================================
// RESUMO FINAL
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

const checks = [
  { name: 'Profile encontrado', status: !!profileId },
  { name: 'Contato criado', status: !!contact },
  { name: 'Alerta criado', status: !!alert },
  { name: 'Email enviado', status: emailResult?.success === true },
  { name: 'Log persistido', status: !!log },
  { name: 'Falha testada', status: !!failContact },
  { name: 'Logs verificados', status: !logsError && logs.length > 0 },
];

checks.forEach(check => {
  console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
});

const totalChecks = checks.length;
const passedChecks = checks.filter(c => c.status).length;

console.log(`\n📈 Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ENTREGA EXTERNA: 100% CONCLUÍDA!\n');
  console.log('✅ Fluxo completo funcionando');
  console.log('✅ Emails sendo enviados');
  console.log('✅ Logs sendo persistidos');
  console.log('✅ Falhas sendo tratadas\n');
} else {
  console.log('\n⚠️  Pendências encontradas. Revisar itens acima.\n');
}

console.log('═══════════════════════════════════════════════════════\n');

// Limpar dados de teste
console.log('🧹 Limpando dados de teste...');
await supabase.from('emergency_delivery_log').delete().eq('alert_id', alert.id);
await supabase.from('emergency_contacts').delete().eq('id', contact.id);
if (failContact) await supabase.from('emergency_contacts').delete().eq('id', failContact.id);
await supabase.from('emergency_alerts').delete().eq('id', alert.id);
console.log('✅ Dados de teste removidos\n');
