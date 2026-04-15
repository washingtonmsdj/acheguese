#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DE ENVIO REAL\n');

// Teste de sucesso
console.log('1️⃣ Testando envio com sucesso...\n');

const { data, error } = await supabase.functions.invoke('send-emergency-email', {
  body: {
    contactId: `test-${Date.now()}`,
    contactName: 'Teste Final',
    contactEmail: 'test@resend.dev',
    alertId: `alert-${Date.now()}`,
    alertType: 'sos',
    alertCreatedAt: new Date().toISOString(),
    userName: 'Sistema Teste',
    userPhone: '11999999999',
    alertDescription: 'Teste final de entrega externa',
  },
});

if (error) {
  console.log('❌ Erro:', error.message);
} else {
  console.log('✅ Resposta da função:');
  console.log(JSON.stringify(data, null, 2));
}

console.log('\n2️⃣ Testando falha (email inválido)...\n');

const { data: failData, error: failError } = await supabase.functions.invoke('send-emergency-email', {
  body: {
    contactId: `fail-${Date.now()}`,
    contactName: 'Teste Falha',
    contactEmail: 'email-invalido',
    alertId: `alert-fail-${Date.now()}`,
    alertType: 'sos',
    alertCreatedAt: new Date().toISOString(),
    userName: 'Teste',
    userPhone: '11999999999',
  },
});

if (failError) {
  console.log('❌ Erro:', failError.message);
} else {
  console.log('✅ Resposta da função:');
  console.log(JSON.stringify(failData, null, 2));
}

console.log('\n✅ Testes concluídos!');
