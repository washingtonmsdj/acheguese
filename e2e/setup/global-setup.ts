/**
 * 🌍 Global Setup - E2E AAA Testing
 * 
 * Executado uma vez antes de todos os testes
 * - Setup de banco de dados de teste
 * - Criação de usuários mock
 * - Seed de dados
 * 
 * @version 1.0.0
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🎮 [E2E Setup] Iniciando ambiente de testes AAA...');
  
  // Verificar variáveis de ambiente
  const requiredEnvVars = ['BASE_URL'];
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ [E2E Setup] Variáveis de ambiente ausentes: ${missing.join(', ')}`);
    console.log('📝 Usando valores padrão...');
  }
  
  // Setup de test data
  process.env.TEST_MODE = 'true';
  process.env.AUTO_ADVANCE_ENABLED = 'true';
  
  console.log('✅ [E2E Setup] Ambiente pronto');
}

export default globalSetup;
