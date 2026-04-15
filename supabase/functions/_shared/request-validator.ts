/**
 * Request Validator
 * Validação robusta de entrada para Edge Functions
 */

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
export type Mode = "spec" | "coach" | "code_patch";
export type Phase = "interpretation" | "plan" | "validation" | "confirmation" | "spec";

export interface ValidatedRequest {
  messages: ChatMessage[];
  currentSpec?: unknown;
  mode: Mode;
  phase?: Phase;
  approvedPlan?: unknown;
  approvedPlanHuman?: unknown;
  targetGameId?: string;
  projectFiles?: unknown;
  userId?: string;
  action?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ValidationError {
  error: string;
  message: string;
  field?: string;
  value?: unknown;
  expected?: string;
}

/**
 * Valida o corpo da requisição de forma robusta
 */
export function validateRequestBody(rawBody: unknown): { success: true; data: ValidatedRequest } | { success: false; error: ValidationError } {
  try {
    // 1. Validação básica do corpo
    if (!rawBody || typeof rawBody !== 'object') {
      return {
        success: false,
        error: {
          error: "INVALID_REQUEST_BODY",
          message: "Request body must be a valid JSON object",
          value: rawBody
        }
      };
    }

    const body = rawBody as Record<string, unknown>;

    // 2. Validação de messages (obrigatório)
    if (!body.messages) {
      return {
        success: false,
        error: {
          error: "MISSING_MESSAGES",
          message: "Messages field is required",
          field: "messages"
        }
      };
    }

    if (!Array.isArray(body.messages)) {
      return {
        success: false,
        error: {
          error: "INVALID_MESSAGES_TYPE",
          message: "Messages must be an array",
          field: "messages",
          value: body.messages,
          expected: "Array<ChatMessage>"
        }
      };
    }

    if (body.messages.length === 0) {
      return {
        success: false,
        error: {
          error: "EMPTY_MESSAGES",
          message: "Messages array cannot be empty",
          field: "messages"
        }
      };
    }

    // Valida cada mensagem
    for (let i = 0; i < body.messages.length; i++) {
      const msg = body.messages[i];
      if (!msg || typeof msg !== 'object') {
        return {
          success: false,
          error: {
            error: "INVALID_MESSAGE_OBJECT",
            message: `Message at index ${i} must be an object`,
            field: `messages[${i}]`,
            value: msg
          }
        };
      }

      const msgRecord = msg as Record<string, unknown>;
      const role = msgRecord.role;
      if (!role || !['user', 'assistant', 'system'].includes(role as string)) {
        return {
          success: false,
          error: {
            error: "INVALID_MESSAGE_ROLE",
            message: `Message at index ${i} has invalid role. Must be 'user', 'assistant', or 'system'`,
            field: `messages[${i}].role`,
            value: role,
            expected: "'user' | 'assistant' | 'system'"
          }
        };
      }

      const content = msgRecord.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        return {
          success: false,
          error: {
            error: "INVALID_MESSAGE_CONTENT",
            message: `Message at index ${i} has invalid content. Must be a non-empty string`,
            field: `messages[${i}].content`,
            value: content
          }
        };
      }
    }

    // 3. Validação de mode (opcional, default: "spec")
    let mode: Mode = "spec";
    if (body.mode !== undefined) {
      if (!['spec', 'coach', 'code_patch'].includes(body.mode as string)) {
        return {
          success: false,
          error: {
            error: "INVALID_MODE",
            message: "Mode must be 'spec', 'coach', or 'code_patch'",
            field: "mode",
            value: body.mode,
            expected: "'spec' | 'coach' | 'code_patch'"
          }
        };
      }
      mode = body.mode as Mode;
    }

    // 4. Validação de phase (opcional para alguns modos)
    let phase: Phase | undefined;
    if (body.phase !== undefined) {
      if (typeof body.phase !== 'string') {
        return {
          success: false,
          error: {
            error: "INVALID_PHASE_TYPE",
            message: "Phase must be a string",
            field: "phase",
            value: body.phase,
            expected: "string"
          }
        };
      }

      const validPhases: Phase[] = ['interpretation', 'plan', 'validation', 'confirmation', 'spec', 'compilation'];
      if (!validPhases.includes(body.phase as Phase)) {
        return {
          success: false,
          error: {
            error: "INVALID_PHASE_VALUE",
            message: `Phase must be one of: ${validPhases.join(', ')}`,
            field: "phase",
            value: body.phase,
            expected: validPhases.join(' | ')
          }
        };
      }
      phase = body.phase as Phase;
    }

    // 5. Validação de sessionId (opcional)
    let sessionId: string | undefined;
    if (body.sessionId !== undefined) {
      if (typeof body.sessionId !== 'string' || body.sessionId.trim().length === 0) {
        return {
          success: false,
          error: {
            error: "INVALID_SESSION_ID",
            message: "Session ID must be a non-empty string",
            field: "sessionId",
            value: body.sessionId
          }
        };
      }
      sessionId = body.sessionId as string;
    }

    // 6. Validação de userId (opcional)
    let userId: string | undefined;
    if (body.userId !== undefined) {
      if (typeof body.userId !== 'string') {
        return {
          success: false,
          error: {
            error: "INVALID_USER_ID",
            message: "User ID must be a string",
            field: "userId",
            value: body.userId
          }
        };
      }
      userId = body.userId as string;
    }

    // 7. Validação de requestId (opcional)
    let requestId: string | undefined;
    if (body.requestId !== undefined) {
      if (typeof body.requestId !== 'string' || body.requestId.trim().length === 0) {
        return {
          success: false,
          error: {
            error: "INVALID_REQUEST_ID",
            message: "Request ID must be a non-empty string",
            field: "requestId",
            value: body.requestId
          }
        };
      }
      requestId = body.requestId as string;
    }

    // 8. Validação de targetGameId (opcional)
    let targetGameId: string | undefined;
    if (body.targetGameId !== undefined) {
      if (typeof body.targetGameId !== 'string') {
        return {
          success: false,
          error: {
            error: "INVALID_TARGET_GAME_ID",
            message: "Target game ID must be a string",
            field: "targetGameId",
            value: body.targetGameId
          }
        };
      }
      targetGameId = body.targetGameId as string;
    }

    // 9. Validação de action (opcional)
    let action: string | undefined;
    if (body.action !== undefined) {
      if (typeof body.action !== 'string' || body.action.trim().length === 0) {
        return {
          success: false,
          error: {
            error: "INVALID_ACTION",
            message: "Action must be a non-empty string",
            field: "action",
            value: body.action
          }
        };
      }
      action = body.action as string;
    }

    // 10. Validação lógica adicional
    // Se mode é "coach", currentSpec é obrigatório
    if (mode === "coach" && body.currentSpec === undefined) {
      return {
        success: false,
        error: {
          error: "MISSING_CURRENT_SPEC_FOR_COACH",
          message: "currentSpec is required when mode is 'coach'",
          field: "currentSpec"
        }
      };
    }

    // ✅ EXCEÇÃO: APPROVE_PLAN não precisa de phase
    // Se é novo jogo (mode === "spec" && !currentSpec), phase é obrigatório
    // EXCETO quando action === "APPROVE_PLAN" (que é um comando out-of-band)
    const isNewGame = mode === "spec" && body.currentSpec === undefined;
    const isApprovalAction = action === "APPROVE_PLAN";

    if (isNewGame && !phase && !isApprovalAction) {
      return {
        success: false,
        error: {
          error: "MISSING_PHASE_FOR_NEW_GAME",
          message: "Phase is required for new game compilation",
          field: "phase",
          expected: "'interpretation' | 'plan' | 'validation' | 'confirmation'"
        }
      };
    }

    // Retorna dados validados
    return {
      success: true,
      data: {
        messages: body.messages as ChatMessage[],
        currentSpec: body.currentSpec,
        mode,
        phase,
        approvedPlan: body.approvedPlan,
        approvedPlanHuman: body.approvedPlanHuman,
        targetGameId,
        projectFiles: body.projectFiles,
        userId,
        action,
        sessionId,
        requestId
      }
    };

  } catch (error) {
    // Erro inesperado durante validação
    return {
      success: false,
      error: {
        error: "VALIDATION_ERROR",
        message: `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`
      }
    };
  }
}

/**
 * Valida se uma fase é válida para transição
 */
export function validatePhaseTransition(
  currentPhase: string | null | undefined,
  requestedPhase: string,
  validTransitions: Record<string, string[]>
): { valid: true } | { valid: false; error: string; validNextPhases: string[] } {
  
  // Se currentPhase é null/undefined, não pode validar transição
  if (!currentPhase) {
    return {
      valid: false,
      error: `Current phase is ${currentPhase === null ? 'null' : 'undefined'}`,
      validNextPhases: []
    };
  }

  // Se já está na fase solicitada, permite re-execução
  if (currentPhase === requestedPhase) {
    return { valid: true };
  }

  const validNextPhases = validTransitions[currentPhase] || [];
  
  if (!validNextPhases.includes(requestedPhase)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentPhase} to ${requestedPhase}`,
      validNextPhases
    };
  }

  return { valid: true };
}

/**
 * Valida se uma sessão está em estado válido
 */
export function validateSessionState(session: unknown): { valid: true } | { valid: false; error: string; details: Record<string, unknown> } {
  const sessionRecord = session as Record<string, unknown>;
  if (!session) {
    return {
      valid: false,
      error: "Session not found",
      details: { hasSession: false }
    };
  }

  if (sessionRecord.phase === null || sessionRecord.phase === undefined) {
    return {
      valid: false,
      error: "Session phase is null or undefined - session corrupted",
      details: {
        hasSession: true,
        phase: sessionRecord.phase,
        phaseType: typeof sessionRecord.phase,
        sessionKeys: Object.keys(sessionRecord)
      }
    };
  }

  return { valid: true };
}