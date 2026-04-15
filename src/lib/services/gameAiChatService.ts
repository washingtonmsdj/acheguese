/**
 * 🤖 Game AI Chat Service — Camada de serviço para comunicação com edge function
 * 
 * SSOT: Todas as chamadas para a edge function "game-ai-chat" DEVEM passar por este serviço.
 * Isso desacopla hooks/componentes do Supabase e permite:
 * - Testes unitários isolados
 * - Retry logic centralizada
 * - Timeout handling consistente
 * - Mocking fácil para testes
 * 
 * Fluxo: Banco/infra (Supabase) -> Service (este arquivo) -> Hook -> Component
 * 
 * @version 1.0.0
 */

import { supabase } from "@/integrations/supabase/client";
import type { CompilerResponse } from "@/lib/ordax/types";
import { TIMEOUTS } from "@/lib/ordax/constants";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GameAiChatRequest {
  mode: "spec" | "chat" | "stream";
  phase?: string;
  messages: ChatMessage[];
  userId?: string;
  sessionId?: string | null;
  requestId?: string;
  currentSpec?: unknown;
  approvedPlan?: unknown;
}

export interface GameAiChatResponse {
  data: CompilerResponse | unknown;
  error: Error | null;
}

export interface InvokeOptions {
  timeoutMs?: number;
  retries?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Invoca a edge function game-ai-chat com timeout e retry opcionais
 * 
 * SSOT: Único ponto de acesso à edge function no frontend
 */
export async function invokeGameAiChat(
  request: GameAiChatRequest,
  options: InvokeOptions = {}
): Promise<GameAiChatResponse> {
  const { timeoutMs = TIMEOUTS.EDGE_FUNCTION_INVOKE_MS, retries = 0 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Criar promise de timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Invocar edge function
      const invokePromise = supabase.functions.invoke("game-ai-chat", {
        body: request,
      });

      // Race entre invoke e timeout
      const { data, error } = await Promise.race([
        invokePromise,
        timeoutPromise,
      ]) as { data: unknown; error: Error | null };

      if (error) {
        throw error;
      }

      return {
        data: data as CompilerResponse,
        error: null,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Se não for a última tentativa, aguardar antes de retry
      if (attempt < retries) {
        const delay = calculateBackoffDelay(attempt);
        await sleep(delay);
      }
    }
  }

  return {
    data: null as unknown as CompilerResponse,
    error: lastError,
  };
}

/**
 * Invoca o planner para novo jogo (fluxo NEW_GAME)
 * 
 * Simplifica a chamada para o caso de uso específico de novo jogo
 */
export async function invokePlanner(
  messages: ChatMessage[],
  userId?: string,
  options?: InvokeOptions
): Promise<GameAiChatResponse> {
  return invokeGameAiChat(
    {
      mode: "spec",
      phase: "interpretation",
      messages,
      userId,
      sessionId: undefined,
    },
    options
  );
}

/**
 * Invoca a próxima fase do compilador (fluxo autoAdvance)
 */
export async function invokeCompilerPhase(
  phase: string,
  messages: ChatMessage[],
  sessionId: string,
  userId?: string,
  requestId?: string,
  options?: InvokeOptions
): Promise<GameAiChatResponse> {
  return invokeGameAiChat(
    {
      mode: "spec",
      phase,
      messages,
      userId,
      sessionId,
      requestId,
    },
    options
  );
}

/**
 * Invoca streaming de geração de spec
 * 
 * @deprecated Use streaming client diretamente para casos de streaming
 */
export async function invokeSpecStreaming(
  messages: ChatMessage[],
  userId?: string,
  sessionId?: string | null,
  currentSpec?: unknown,
  approvedPlan?: unknown,
  options?: InvokeOptions
): Promise<GameAiChatResponse> {
  return invokeGameAiChat(
    {
      mode: "stream",
      messages,
      userId,
      sessionId,
      currentSpec,
      approvedPlan,
    },
    options
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateBackoffDelay(attempt: number, baseDelayMs: number = 800): number {
  // Exponential backoff: baseDelay * (2 ^ attempt)
  const backoff = baseDelayMs * Math.pow(2, attempt);
  // Jitter: ±25% para evitar thundering herd
  const jitter = 0.75 + Math.random() * 0.5;
  return Math.floor(backoff * jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use invokeGameAiChat ou invokePlanner
 * Mantido para compatibilidade com código legado
 */
export async function legacyGenerateSpec(
  messages: ChatMessage[],
  currentSpec?: unknown,
  userId?: string
): Promise<GameAiChatResponse> {
  console.warn("⚠️ legacyGenerateSpec is deprecated. Use invokePlanner or invokeGameAiChat");
  
  const isNewGame = !currentSpec;
  
  return invokeGameAiChat({
    mode: "spec",
    phase: isNewGame ? "interpretation" : undefined,
    messages,
    userId,
    currentSpec,
  });
}
