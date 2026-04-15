/**
 * Session Validator
 * 
 * Valida e carrega sessões do CompilerSessionStore.
 * Extraído de game-ai-chat-stream/index.ts para ser testável e reutilizável.
 */

import { CompilerSessionStore } from "./compiler-session-store.ts";
import { isGamePlanInput } from "./type-guards.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface CompilerSession {
  id?: string;
  approvedByUser: boolean;
  gamePlan?: unknown;
  phase?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface SessionValidationSuccess {
  success: true;
  session: CompilerSession;
  rawGamePlan: unknown;
  sessionStore: CompilerSessionStore;
}

export interface SessionValidationError {
  success: false;
  errorCode: string;
  errorMessage: string;
  statusCode: number;
}

export type SessionValidationResult = SessionValidationSuccess | SessionValidationError;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valida e carrega uma sessão do CompilerSessionStore
 * 
 * Verifica:
 * - Sessão existe
 * - Plano foi aprovado pelo usuário
 * - Plano existe e é válido
 * 
 * @param sessionId - ID da sessão
 * @param supabaseUrl - URL do Supabase
 * @param supabaseKey - Service role key do Supabase
 * @returns Resultado da validação
 */
export async function validateSession(
  sessionId: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<SessionValidationResult> {
  // Carrega sessão
  const sessionStore = new CompilerSessionStore(supabaseUrl, supabaseKey);
  const session = await sessionStore.loadSession(sessionId);

  if (!session) {
    return {
      success: false,
      errorCode: "SESSION_NOT_FOUND",
      errorMessage: "Session not found. Start a new game first.",
      statusCode: 404
    };
  }

  if (!session.approvedByUser) {
    return {
      success: false,
      errorCode: "PLAN_NOT_APPROVED",
      errorMessage: "Game plan must be approved before compilation",
      statusCode: 400
    };
  }

  const rawGamePlan = session.gamePlan;
  if (!rawGamePlan) {
    return {
      success: false,
      errorCode: "NO_GAME_PLAN",
      errorMessage: "No game plan found in session",
      statusCode: 400
    };
  }

  if (!isGamePlanInput(rawGamePlan)) {
    return {
      success: false,
      errorCode: "INVALID_GAME_PLAN",
      errorMessage: "Game plan in session is invalid",
      statusCode: 400
    };
  }

  return {
    success: true,
    session,
    rawGamePlan,
    sessionStore
  };
}

/**
 * Valida se um plano inline é válido
 * 
 * @param approvedPlan - Plano aprovado inline
 * @returns true se válido, false caso contrário
 */
export function validateInlinePlan(approvedPlan: unknown): boolean {
  return isGamePlanInput(approvedPlan);
}
