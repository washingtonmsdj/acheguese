/**
 * Script para testar integração do Sentry
 * 
 * Este script força um erro de teste para verificar se o Sentry
 * está capturando e enviando erros corretamente.
 * 
 * Uso:
 *   npx tsx scripts/test-sentry.ts
 */

import * as Sentry from '@sentry/react';
import { config } from 'dotenv';

// Carregar variáveis do .env.local
config({ path: '.env.local' });

// Inicializar Sentry
const SENTRY_DSN = process.env.VITE_SENTRY_DSN;

if (!SENTRY_DSN) {
  console.error('❌ VITE_SENTRY_DSN não configurado no .env.local');
  process.exit(1);
}

console.log('🔧 Inicializando Sentry...');
Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.VITE_SENTRY_ENVIRONMENT || 'development',
  release: process.env.VITE_SENTRY_RELEASE || '1.0.0',
  tracesSampleRate: 1.0,
});

console.log('✅ Sentry inicializado');
console.log('📍 DSN:', SENTRY_DSN.substring(0, 30) + '...');
console.log('🌍 Environment:', process.env.VITE_SENTRY_ENVIRONMENT);
console.log('📦 Release:', process.env.VITE_SENTRY_RELEASE);
console.log('');

// Teste 1: Erro simples
console.log('🧪 Teste 1: Enviando erro simples...');
try {
  throw new Error('🧪 Teste Sentry - Erro simples de teste');
} catch (error) {
  Sentry.captureException(error);
  console.log('✅ Erro enviado ao Sentry');
}

// Teste 2: Erro com contexto
console.log('🧪 Teste 2: Enviando erro com contexto...');
Sentry.setUser({
  id: 'test-user-123',
  email: 'teste@acheguese.com.br',
  username: 'Usuario Teste',
});

Sentry.setContext('teste', {
  tipo: 'script-teste',
  timestamp: new Date().toISOString(),
  ambiente: 'local',
});

try {
  throw new Error('🧪 Teste Sentry - Erro com contexto de usuário');
} catch (error) {
  Sentry.captureException(error);
  console.log('✅ Erro com contexto enviado ao Sentry');
}

// Teste 3: Mensagem customizada
console.log('🧪 Teste 3: Enviando mensagem customizada...');
Sentry.captureMessage('🧪 Teste Sentry - Mensagem de teste', 'info');
console.log('✅ Mensagem enviada ao Sentry');

// Aguardar envio
console.log('');
console.log('⏳ Aguardando envio para o Sentry (5 segundos)...');
setTimeout(() => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║  ✅ TESTES CONCLUÍDOS                                 ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Verifique o dashboard do Sentry:');
  console.log('   https://sentry.io/organizations/seu-org/issues/');
  console.log('');
  console.log('Você deve ver 3 novos eventos:');
  console.log('   1. 🧪 Teste Sentry - Erro simples de teste');
  console.log('   2. 🧪 Teste Sentry - Erro com contexto de usuário');
  console.log('   3. 🧪 Teste Sentry - Mensagem de teste');
  console.log('');
  console.log('⏰ Os eventos podem levar até 1 minuto para aparecer');
  console.log('');
  
  process.exit(0);
}, 5000);
