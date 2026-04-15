/**
 * 🎮 TESTES E2E AAA - StudioChatPanel
 * 
 * Features testadas:
 * - Fluxo completo NEW_GAME (interpretation → plan → validation → confirmation)
 * - Validação de sequência de mensagens (última deve ser do usuário)
 * - Auto-advance entre fases do compilador
 * - Tratamento de erros e fail-fast
 * - Race conditions e requisições duplicadas
 * - SSR safety e hydration
 * 
 * @version 1.0.0
 * @priority AAA (Production Critical)
 */

import { test, expect, Page } from '@playwright/test';
import { CHAT_MESSAGES } from '@/components/ordax/studioChatPanelConstants';

// ═══════════════════════════════════════════════════════════════════════════════
// FIXTURES E HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CompilerResponse {
  kind: string;
  phase: string;
  sessionId: string;
  nextPhase?: string;
}

/**
 * Helper: Aguarda mensagem específica do compilador
 */
async function waitForCompilerResponse(
  page: Page, 
  expectedKind: string, 
  timeout = 30000
): Promise<CompilerResponse> {
  return page.waitForFunction(
    (kind) => {
      const responses = (window as unknown as { 
        __TEST_COMPILER_RESPONSES?: CompilerResponse[] 
      }).__TEST_COMPILER_RESPONSES || [];
      return responses.find(r => r.kind === kind);
    },
    expectedKind,
    { timeout }
  ) as Promise<CompilerResponse>;
}

/**
 * Helper: Obtém todas as mensagens do chat
 */
async function getChatMessages(page: Page): Promise<ChatMessage[]> {
  return page.evaluate(() => {
    const messages: ChatMessage[] = [];
    const elements = document.querySelectorAll('[data-testid="chat-message"]');
    elements.forEach(el => {
      const role = el.getAttribute('data-role') as 'user' | 'assistant';
      const content = el.textContent || '';
      if (role) messages.push({ role, content });
    });
    return messages;
  });
}

/**
 * Helper: Valida que última mensagem é do usuário
 */
async function validateLastMessageIsUser(page: Page): Promise<boolean> {
  const messages = await getChatMessages(page);
  if (messages.length === 0) return false;
  return messages[messages.length - 1].role === 'user';
}

/**
 * Helper: Aguarda estado de loading
 */
async function waitForLoadingState(page: Page, isLoading: boolean, timeout = 10000) {
  const selector = isLoading ? '[data-testid="chat-loading"]' : '[data-testid="chat-input-enabled"]';
  await page.waitForSelector(selector, { timeout });
}

/**
 * Helper: Envia mensagem com retry
 */
async function sendMessageWithRetry(
  page: Page, 
  text: string, 
  maxRetries = 3
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.fill('[data-testid="chat-input"]', text);
      await page.click('[data-testid="chat-send-button"]');
      await waitForLoadingState(page, true, 5000);
      return true;
    } catch (err) {
      console.log(`[E2E] Retry ${i + 1}/${maxRetries} failed:`, err);
      if (i === maxRetries - 1) return false;
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: FLUXO NEW_GAME
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('🏗️ FLUXO NEW_GAME - End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    // Reset estado antes de cada teste
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="studio-chat-panel"]', { timeout: 10000 });
    
    // Limpar estado do compilador
    await page.evaluate(() => {
      localStorage.removeItem('ordax_compiler_session');
      localStorage.removeItem('ordax_chat_messages');
    });
  });

  test('✅ TC-001: Fluxo completo NEW_GAME - interpretation → plan → validation → confirmation', async ({ page }) => {
    // Arrange
    const gameDescription = 'Crie um jogo de plataforma 2D onde o jogador controla um gato que coleta moedas e evita cachorros';
    
    // Act - Enviar mensagem inicial
    const sent = await sendMessageWithRetry(page, gameDescription);
    expect(sent).toBe(true);
    
    // Assert - Deve entrar em estado de loading/planning
    await waitForLoadingState(page, true);
    
    // Assert - Deve receber INTERPRETATION_RESULT
    const interpretationResponse = await waitForCompilerResponse(page, 'INTERPRETATION_RESULT', 30000);
    expect(interpretationResponse.kind).toBe('INTERPRETATION_RESULT');
    expect(interpretationResponse.sessionId).toBeTruthy();
    expect(interpretationResponse.nextPhase).toBe('plan');
    
    // Assert - Auto-advance deve continuar para PLAN_RESULT
    const planResponse = await waitForCompilerResponse(page, 'PLAN_RESULT', 30000);
    expect(planResponse.kind).toBe('PLAN_RESULT');
    expect(planResponse.nextPhase).toBe('validation');
    
    // Assert - Auto-advance deve continuar para VALIDATION_RESULT
    const validationResponse = await waitForCompilerResponse(page, 'VALIDATION_RESULT', 30000);
    expect(validationResponse.kind).toBe('VALIDATION_RESULT');
    expect(validationResponse.nextPhase).toBe('confirmation');
    
    // Assert - Deve parar em CONFIRMATION_REQUIRED
    const confirmationResponse = await waitForCompilerResponse(page, 'CONFIRMATION_REQUIRED', 30000);
    expect(confirmationResponse.kind).toBe('CONFIRMATION_REQUIRED');
    
    // Assert - UI deve mostrar tela de confirmação
    await page.waitForSelector('[data-testid="plan-review-drawer"]', { timeout: 10000 });
    
    // Assert - Input deve estar desabilitado durante confirmação
    const inputDisabled = await page.isDisabled('[data-testid="chat-input"]');
    expect(inputDisabled).toBe(true);
  });

  test('✅ TC-002: Validação de sequência de mensagens - última sempre deve ser do usuário', async ({ page }) => {
    // Arrange
    const gameDescription = 'Jogo simples de puzzle';
    
    // Act
    await sendMessageWithRetry(page, gameDescription);
    
    // Assert - Durante todo o fluxo, validar sequência
    let lastValidationTime = Date.now();
    const maxWaitTime = 60000; // 1 minuto máximo
    
    while (Date.now() - lastValidationTime < maxWaitTime) {
      const isUserLast = await validateLastMessageIsUser(page);
      
      if (!isUserLast) {
        // Verificar se é porque recebemos resposta do assistente
        const messages = await getChatMessages(page);
        const lastMessage = messages[messages.length - 1];
        
        if (lastMessage?.role === 'assistant') {
          // Isso é esperado após receber resposta, mas antes do autoAdvance
          // Aguardar próximo ciclo
          await page.waitForTimeout(100);
          continue;
        }
        
        // Se chegou aqui, é um erro real
        throw new Error(
          `[E2E] ❌ VALIDAÇÃO FALHOU: Última mensagem não é do usuário. ` +
          `Role atual: ${lastMessage?.role}, Content: ${lastMessage?.content?.substring(0, 50)}`
        );
      }
      
      // Verificar se chegou ao fim (CONFIRMATION_REQUIRED)
      const hasConfirmation = await page.evaluate(() => {
        return document.querySelector('[data-testid="confirmation-required"]') !== null;
      });
      
      if (hasConfirmation) break;
      
      await page.waitForTimeout(100);
    }
    
    // Assert final
    const finalValidation = await validateLastMessageIsUser(page);
    expect(finalValidation).toBe(true);
  });

  test('✅ TC-003: Auto-advance continua mesmo se messagesRef não atualizou', async ({ page }) => {
    // Arrange - Simular condição de race condition
    const gameDescription = 'Jogo de aventura com quests';
    
    // Inject mock para simular atraso no messagesRef
    await page.evaluate(() => {
      // Simular atraso artificial
      const originalSetMessages = (window as unknown as { 
        __setMessages?: (fn: (prev: unknown[]) => unknown[]) => void 
      }).__setMessages;
      
      if (originalSetMessages) {
        (window as unknown as { 
          __setMessages?: (fn: (prev: unknown[]) => unknown[]) => void 
        }).__setMessages = (fn) => {
          setTimeout(() => originalSetMessages(fn), 100);
        };
      }
    });
    
    // Act
    await sendMessageWithRetry(page, gameDescription);
    
    // Assert - Mesmo com atraso simulado, deve completar o fluxo
    const planResponse = await waitForCompilerResponse(page, 'PLAN_RESULT', 45000);
    expect(planResponse).toBeTruthy();
    expect(planResponse.kind).toBe('PLAN_RESULT');
  });

  test('✅ TC-004: Tratamento de erro quando última mensagem não é do usuário', async ({ page }) => {
    // Arrange - Criar estado inconsistente
    await page.evaluate(() => {
      // Simular estado onde última mensagem é do assistente
      const badMessages: ChatMessage[] = [
        { role: 'user', content: 'Olá' },
        { role: 'assistant', content: 'Resposta' },
        { role: 'assistant', content: 'Outra resposta sem usuário responder' }
      ];
      localStorage.setItem('ordax_chat_messages', JSON.stringify(badMessages));
    });
    
    // Recarregar para aplicar estado
    await page.reload();
    await page.waitForSelector('[data-testid="studio-chat-panel"]', { timeout: 10000 });
    
    // Act - Tentar enviar mensagem
    await sendMessageWithRetry(page, 'Nova mensagem');
    
    // Assert - Deve mostrar erro apropriado (não crashar)
    const errorToast = await page.waitForSelector(
      '[data-testid="error-toast"]:has-text("última mensagem deve ser do usuário")',
      { timeout: 10000, state: 'visible' }
    );
    expect(errorToast).toBeTruthy();
    
    // Assert - Deve permitir retry
    const retryButton = await page.waitForSelector('[data-testid="retry-button"]', { timeout: 5000 });
    expect(retryButton).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: RACE CONDITIONS E CONCORRÊNCIA
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('⚡ RACE CONDITIONS - Concorrência e Consistência', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="studio-chat-panel"]', { timeout: 10000 });
  });

  test('✅ TC-005: Bloqueio de chamadas duplicadas ao autoAdvance', async ({ page }) => {
    // Arrange
    const gameDescription = 'Jogo de estratégia em turnos';
    
    // Setup spy para detectar chamadas duplicadas
    const duplicateCalls: number[] = [];
    await page.exposeFunction('__trackAutoAdvanceCall', (timestamp: number) => {
      duplicateCalls.push(timestamp);
    });
    
    await page.evaluate(() => {
      const originalAdvance = (window as unknown as { 
        __originalAdvance?: () => Promise<void> 
      }).__originalAdvance;
      
      if (originalAdvance) {
        (window as unknown as { 
          __advance?: () => Promise<void> 
        }).__advance = async () => {
          (window as unknown as { 
            __trackAutoAdvanceCall?: (ts: number) => void 
          }).__trackAutoAdvanceCall?.(Date.now());
          return originalAdvance();
        };
      }
    });
    
    // Act
    await sendMessageWithRetry(page, gameDescription);
    await page.waitForTimeout(5000); // Aguardar processamento
    
    // Assert - Não deve haver chamadas com menos de 500ms de diferença
    for (let i = 1; i < duplicateCalls.length; i++) {
      const diff = duplicateCalls[i] - duplicateCalls[i - 1];
      expect(diff).toBeGreaterThan(500);
    }
  });

  test('✅ TC-006: Respostas fora de ordem são ignoradas (race condition backend)', async ({ page }) => {
    // Arrange
    const gameDescription = 'RPG de ação em tempo real';
    
    // Act
    await sendMessageWithRetry(page, gameDescription);
    
    // Aguardar primeira resposta
    await waitForCompilerResponse(page, 'INTERPRETATION_RESULT', 30000);
    
    // Simular resposta atrasada de request anterior
    await page.evaluate(() => {
      // Injetar resposta falsa atrasada
      const fakeResponse: CompilerResponse = {
        kind: 'INTERPRETATION_RESULT',
        phase: 'interpretation',
        sessionId: 'fake-old-session',
        nextPhase: 'plan'
      };
      
      // Disparar evento como se viesse do backend
      window.dispatchEvent(new CustomEvent('compiler-response', { 
        detail: fakeResponse 
      }));
    });
    
    // Assert - Fluxo deve continuar normalmente (não deve processar resposta falsa)
    await page.waitForTimeout(2000);
    
    const consoleErrors = await page.evaluate(() => {
      return (window as unknown as { 
        __consoleErrors?: string[] 
      }).__consoleErrors || [];
    });
    
    const hasRaceConditionWarning = consoleErrors.some(e => 
      e.includes('race condition') || e.includes('Ignorando resposta')
    );
    
    expect(hasRaceConditionWarning).toBe(true);
  });

  test('✅ TC-007: Duplicatas de resposta são detectadas e ignoradas', async ({ page }) => {
    // Arrange
    const gameDescription = 'Jogo de puzzle lógico';
    let responseCount = 0;
    
    await page.exposeFunction('__countCompilerResponse', () => {
      responseCount++;
    });
    
    // Act
    await sendMessageWithRetry(page, gameDescription);
    
    // Aguardar e contar respostas
    await page.waitForTimeout(10000);
    
    // Assert - Não deve haver respostas duplicadas (mesmo kind/phase/sessionId)
    const responses = await page.evaluate(() => {
      return (window as unknown as { 
        __testCompilerResponses?: CompilerResponse[] 
      }).__testCompilerResponses || [];
    });
    
    const uniqueKeys = new Set<string>();
    const duplicates: string[] = [];
    
    for (const r of responses) {
      const key = `${r.kind}-${r.phase}-${r.sessionId}`;
      if (uniqueKeys.has(key)) {
        duplicates.push(key);
      }
      uniqueKeys.add(key);
    }
    
    expect(duplicates).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: TRATAMENTO DE ERROS (FAIL-FAST)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('🛡️ FAIL-FAST - Tratamento de Erros', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="studio-chat-panel"]', { timeout: 10000 });
  });

  test('✅ TC-008: Erro 400 (Bad Request) para imediatamente sem retry', async ({ page }) => {
    // Arrange - Mock para retornar erro 400
    await page.route('**/game-ai-chat', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'INVALID_PHASE_TRANSITION',
          error: 'Invalid transition',
          message: 'Cannot transition from compilation to confirmation'
        })
      });
    });
    
    // Act
    await sendMessageWithRetry(page, 'Teste de erro 400');
    
    // Assert - Deve mostrar erro imediatamente (sem retry)
    const errorToast = await page.waitForSelector(
      '[data-testid="error-toast"]:has-text("fluxo de criação")',
      { timeout: 5000 }
    );
    expect(errorToast).toBeTruthy();
    
    // Assert - Não deve haver retry (verificar console)
    const logs = await page.evaluate(() => {
      return (window as unknown as { 
        __networkLogs?: { url: string; count: number }[] 
      }).__networkLogs || [];
    });
    
    const gameAiChatCalls = logs.filter(l => l.url.includes('game-ai-chat'));
    expect(gameAiChatCalls.length).toBe(1); // Apenas 1 chamada, sem retry
  });

  test('✅ TC-009: Erro 500 (Server Error) tenta retry com backoff', async ({ page }) => {
    // Arrange - Mock para retornar erro 500 nas primeiras 2 tentativas
    let requestCount = 0;
    await page.route('**/game-ai-chat', async (route) => {
      requestCount++;
      if (requestCount <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        // Terceira tentativa: sucesso
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            kind: 'INTERPRETATION_RESULT',
            phase: 'interpretation',
            sessionId: 'test-session-123',
            nextPhase: 'plan'
          })
        });
      }
    });
    
    // Act
    await sendMessageWithRetry(page, 'Teste de retry');
    
    // Assert - Deve completar após retries
    const response = await waitForCompilerResponse(page, 'INTERPRETATION_RESULT', 30000);
    expect(response).toBeTruthy();
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });

  test('✅ TC-010: Timeout de rede tenta retry', async ({ page }) => {
    // Arrange - Mock para nunca responder (timeout)
    await page.route('**/game-ai-chat', async (route) => {
      // Não responder = timeout
    });
    
    // Act
    await sendMessageWithRetry(page, 'Teste de timeout');
    
    // Assert - Deve mostrar mensagem de retry
    const warningToast = await page.waitForSelector(
      '[data-testid="warning-toast"]:has-text("Tentando novamente")',
      { timeout: 15000 }
    );
    expect(warningToast).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: SSR E HYDRATION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('🌐 SSR - Server-Side Rendering e Hydration', () => {
  test('✅ TC-011: Componente renderiza corretamente com JavaScript desabilitado', async ({ browser }) => {
    // Arrange - Criar contexto sem JavaScript
    const context = await browser.newContext({
      javaScriptEnabled: false
    });
    const page = await context.newPage();
    
    // Act
    await page.goto('/studio');
    
    // Assert - Deve mostrar mensagem de erro amigável ou fallback
    const hasContent = await page.evaluate(() => {
      return document.body.textContent?.includes('JavaScript') || 
             document.body.textContent?.includes('recarregar') ||
             document.querySelector('[data-testid="studio-chat-panel"]') !== null;
    });
    
    expect(hasContent).toBe(true);
    
    await context.close();
  });

  test('✅ TC-012: Hydration não causa duplicação de mensagens', async ({ page }) => {
    // Arrange - Estado pré-existente
    await page.evaluate(() => {
      const existingMessages: ChatMessage[] = [
        { role: 'assistant', content: 'Bem-vindo!' },
        { role: 'user', content: 'Criar jogo' }
      ];
      localStorage.setItem('ordax_chat_messages', JSON.stringify(existingMessages));
    });
    
    // Act - Recarregar (simula hydration)
    await page.reload();
    await page.waitForSelector('[data-testid="studio-chat-panel"]', { timeout: 10000 });
    
    // Assert - Não deve haver duplicação
    const messages = await getChatMessages(page);
    const uniqueContents = new Set(messages.map(m => m.content));
    expect(uniqueContents.size).toBe(messages.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: PERFORMANCE E LIMITE DE CARGA
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('🚀 PERFORMANCE - Benchmarks e Limites', () => {
  test('✅ TC-013: Tempo de resposta do interpretation < 5s', async ({ page }) => {
    // Arrange
    const gameDescription = 'Jogo simples de clique';
    const startTime = Date.now();
    
    // Act
    await sendMessageWithRetry(page, gameDescription);
    await waitForCompilerResponse(page, 'INTERPRETATION_RESULT', 30000);
    
    // Assert
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(5000);
  });

  test('✅ TC-014: Memória não cresce indefinidamente com mensagens', async ({ page }) => {
    // Arrange - Enviar múltiplas mensagens
    const initialMemory = await page.evaluate(() => {
      return (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    });
    
    // Act - Enviar 10 mensagens
    for (let i = 0; i < 10; i++) {
      await sendMessageWithRetry(page, `Mensagem de teste ${i}`);
      await page.waitForTimeout(2000);
    }
    
    // Assert
    const finalMemory = await page.evaluate(() => {
      return (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    });
    
    // Memória não deve crescer mais que 50MB
    const growth = (finalMemory - initialMemory) / (1024 * 1024);
    expect(growth).toBeLessThan(50);
  });
});
