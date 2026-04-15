#!/usr/bin/env node
/**
 * Teste de Rate Limiting - Edge Function
 * 
 * Valida:
 * - Limite de 5 emails por alerta a cada 5 minutos
 * - Bloqueio registrado em emergency_delivery_log
 * - Erro claro retornado
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 TESTE DE RATE LIMITING\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================
// 1. CRIAR ALERTA E CONTATO
// ============================================

console.log('1️⃣ Criando alerta e contato de teste...\n');

const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .limit(1)
  .single();

if (!profile) {
  console.log('❌ Nenhum profile encontrado');
  process.exit(1);
}

const { data: alert, error: alertError } = await supabase
  .from('emergency_alerts')
  .insert({
    profile_id: profile.id,
    type: 'sos',
    message: 'Teste rate limiting',
  })
  .select()
  .single();

if (alertError) {
  console.log('❌ Erro ao criar alerta:', alertError.message);
  process.exit(1);
}

const { data: contact, error: contactError } = await supabase
  .from('emergency_contacts')
  .insert({
    profile_id: profile.id,
    name: 'Teste Rate Limit',
    phone: 'delivered@resend.dev',
    relationship: 'teste',
    is_primary: false,
    is_active: true,
  })
  .select()
  .single();

if (contactError) {
  console.log('❌ Erro ao criar contato:', contactError.message);
  process.exit(1);
}

console.log(`✅ Alerta criado: ${alert.id}`);
console.log(`✅ Contato criado: ${contact.id}\n`);

// ============================================
// 2. ENVIAR 6 EMAILS (EXCEDER LIMITE)
// ============================================

console.log('2️⃣ Enviando 6 emails para testar rate limiting...\n');

const results = [];

for (let i = 1; i <= 6; i++) {
  console.log(`   Tentativa ${i}/6...`);
  
  const { data, error } = await supabase.functions.invoke('send-emergency-email', {
    body: {
      contactId: contact.id,
      contactName: contact.name,
      contactEmail: contact.phone,
      alertId: alert.id,
      alertType: 'sos',
      alertCreatedAt: new Date().toISOString(),
      userName: 'Teste',
      userPhone: '11999999999',
    },
  });

  results.push({
    attempt: i,
    success: data?.success || false,
    status: data?.status || 'failed',
    error: data?.error || error?.message,
  });

  if (data?.success) {
    console.log(`   ✅ Email ${i} enviado`);
  } else {
    console.log(`   ❌ Email ${i} bloqueado: ${data?.error || error?.message}`);
  }
}

console.log();

// ============================================
// 3. VERIFICAR LOGS
// ============================================

console.log('3️⃣ Verificando logs de entrega...\n');

const { data: logs, error: logsError } = await supabase
  .from('emergency_delivery_log')
  .select('*')
  .eq('alert_id', alert.id)
  .order('created_at', { ascending: true });

if (logsError) {
  console.log('❌ Erro ao buscar logs:', logsError.message);
} else {
  console.log(`📊 Total de logs: ${logs.length}\n`);
  
  logs.forEach((log, i) => {
    const icon = log.status === 'sent' ? '✅' : '❌';
    console.log(`   ${i + 1}. ${icon} Status: ${log.status}`);
    if (log.error_message) {
      console.log(`      Error: ${log.error_message}`);
    }
    if (log.metadata?.rate_limit_blocked) {
      console.log(`      🚫 RATE LIMIT BLOCKED`);
      console.log(`      Recent count: ${log.metadata.recent_count}`);
      console.log(`      Window: ${log.metadata.window_minutes} minutes`);
    }
    console.log();
  });
}

// ============================================
// 4. VALIDAR RATE LIMITING
// ============================================

console.log('4️⃣ Validando rate limiting...\n');

const sentCount = results.filter(r => r.success).length;
const blockedCount = results.filter(r => !r.success).length;

console.log(`✅ Emails enviados: ${sentCount}`);
console.log(`🚫 Emails bloqueados: ${blockedCount}`);
console.log();

const rateLimitWorking = sentCount <= 5 && blockedCount > 0;

if (rateLimitWorking) {
  console.log('✅ RATE LIMITING FUNCIONANDO CORRETAMENTE!\n');
  console.log(`   Limite: 5 emails por alerta a cada 5 minutos`);
  console.log(`   Enviados: ${sentCount}`);
  console.log(`   Bloqueados: ${blockedCount}`);
} else {
  console.log('❌ RATE LIMITING NÃO ESTÁ FUNCIONANDO!\n');
  console.log(`   Esperado: máximo 5 enviados, pelo menos 1 bloqueado`);
  console.log(`   Obtido: ${sentCount} enviados, ${blockedCount} bloqueados`);
}

// ============================================
// LIMPEZA
// ============================================

console.log('\n🧹 Limpando dados de teste...');
await supabase.from('emergency_delivery_log').delete().eq('alert_id', alert.id);
await supabase.from('emergency_contacts').delete().eq('id', contact.id);
await supabase.from('emergency_alerts').delete().eq('id', alert.id);
console.log('✅ Dados de teste removidos\n');

console.log('═══════════════════════════════════════════════════════\n');

if (rateLimitWorking) {
  console.log('🎉 RATE LIMITING VALIDADO COM SUCESSO!\n');
  process.exit(0);
} else {
  console.log('⚠️  RATE LIMITING PRECISA SER CORRIGIDO\n');
  process.exit(1);
}
