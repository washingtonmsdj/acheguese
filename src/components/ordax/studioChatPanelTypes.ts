// Type guards e validações para StudioChatPanel.tsx
// Garante 100% type safety e validações em runtime

import type { 
  OrdaxSpec, 
  ChatMsg, 
  CompilerResponse, 
  CompilerPhase,
  CodeSemanticPatch,
  GamePlanResult
} from "@/lib/ordax/types";
import { isValidCompilerPhase } from "@/lib/ordax/constants";
import { CHAT_CONSTANTS } from "@/components/ordax/studioChatPanelConstants";

// ============================================================================
// TYPE GUARDS BÁSICOS
// ============================================================================

/**
 * Type guard para verificar se um valor é string não vazia
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard para verificar se um valor é array não vazio
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard para verificar se um valor é objeto não nulo
 */
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ============================================================================
// TYPE GUARDS PARA TIPOS DO ORDAX
// ============================================================================

/**
 * Type guard para ChatMsg
 */
export function isChatMsg(value: unknown): value is ChatMsg {
  if (!isNonNullObject(value)) return false;
  
  const { role, content } = value as Partial<ChatMsg>;
  return (
    (role === "user" || role === "assistant" || role === "system") &&
    typeof content === "string" &&
    content.trim().length > 0
  );
}

/**
 * Type guard para array de ChatMsg
 */
export function isChatMsgArray(value: unknown): value is ChatMsg[] {
  if (!Array.isArray(value)) return false;
  return value.every(isChatMsg);
}

/**
 * Type guard para OrdaxSpec (validação básica)
 */
export function isOrdaxSpec(value: unknown): value is OrdaxSpec {
  if (!isNonNullObject(value)) return false;
  
  const spec = value as Partial<OrdaxSpec>;
  
  // Validações mínimas
  const hasTitle = typeof spec.title === "string" && spec.title.trim().length > 0;
  const hasGameType = typeof spec.gameType === "string" && spec.gameType.trim().length > 0;
  const hasSystems = Array.isArray(spec.systems);
  const hasScene = isNonNullObject(spec.scene);
  const hasEntities = Array.isArray(spec.scene?.entities);
  
  return hasTitle && hasGameType && hasSystems && hasScene && hasEntities;
}

/**
 * Type guard para PartialOrdaxSpec (validação leniente)
 */
export function isPartialOrdaxSpec(value: unknown): value is Partial<OrdaxSpec> {
  if (!isNonNullObject(value)) return false;
  
  const spec = value as Partial<OrdaxSpec>;
  
  // Valida apenas campos presentes
  if (spec.title !== undefined && typeof spec.title !== "string") return false;
  if (spec.gameType !== undefined && typeof spec.gameType !== "string") return false;
  if (spec.systems !== undefined && !Array.isArray(spec.systems)) return false;
  if (spec.scene !== undefined && !isNonNullObject(spec.scene)) return false;
  if (spec.scene?.entities !== undefined && !Array.isArray(spec.scene.entities)) return false;
  
  return true;
}

/**
 * Type guard para CompilerResponse
 */
export function isCompilerResponse(value: unknown): value is CompilerResponse {
  if (!isNonNullObject(value)) return false;
  
  const response = value as Partial<CompilerResponse>;
  
  // Valida kind obrigatório
  if (typeof response.kind !== "string") return false;
  
  // Valida phase se presente
  if (response.phase !== undefined && typeof response.phase !== "string") return false;
  
  // Valida sessionId se presente
  if (response.sessionId !== undefined && typeof response.sessionId !== "string") return false;
  
  return true;
}

/**
 * Type guard para CompilerPhase — delega ao SSOT lib/ordax/constants.ts
 */
export function isCompilerPhase(value: unknown): value is CompilerPhase {
  if (typeof value !== "string") return false;
  return isValidCompilerPhase(value);
}

/**
 * Type guard para CodeSemanticPatch
 */
export function isCodeSemanticPatch(value: unknown): value is CodeSemanticPatch {
  if (!isNonNullObject(value)) return false;
  
  const patch = value as Partial<CodeSemanticPatch>;
  
  // Valida kind obrigatório
  if (patch.kind !== "CODE_SEMANTIC_PATCH" && patch.kind !== "SEMANTIC_PATCH") return false;
  
  // Valida ops obrigatório
  if (!Array.isArray(patch.ops)) return false;
  
  // Valida cada op tem propriedades mínimas
  const isValidOps = patch.ops.every((op: unknown) => {
    if (!isNonNullObject(op)) return false;
    const operation = op as Record<string, unknown>;
    return typeof operation.op === "string" && operation.op.trim().length > 0;
  });
  
  return isValidOps;
}

/**
 * Type guard para GamePlanResult
 */
export function isGamePlanResult(value: unknown): value is GamePlanResult {
  if (!isNonNullObject(value)) return false;
  
  const result = value as Partial<GamePlanResult>;
  
  // Plano é obrigatório
  if (!isNonNullObject(result.plan)) return false;
  
  // Validações do plano
  const plan = result.plan as Record<string, unknown>;
  const hasTitle = typeof plan.title === "string" && plan.title.trim().length > 0;
  const hasGameType = typeof plan.gameType === "string" && plan.gameType.trim().length > 0;
  
  if (!hasTitle || !hasGameType) return false;
  
  // Valida arrays opcionais
  if (result.planWarnings !== undefined && !Array.isArray(result.planWarnings)) return false;
  if (result.planDiff !== undefined && !isNonNullObject(result.planDiff)) return false;
  if (result.engineGapReport !== undefined && !isNonNullObject(result.engineGapReport)) return false;
  
  return true;
}

// ============================================================================
// VALIDAÇÕES DE RUNTIME
// ============================================================================

/**
 * Valida props do StudioChatPanel
 */
export function validateStudioChatPanelProps(props: unknown): {
  isValid: boolean;
  errors: string[];
  validatedProps: {
    onSpec: (spec: OrdaxSpec, raw: string) => void;
    currentSpec?: OrdaxSpec;
    gameId?: string;
  } | null;
} {
  const errors: string[] = [];
  
  if (!isNonNullObject(props)) {
    return {
      isValid: false,
      errors: ["Props deve ser um objeto"],
      validatedProps: null
    };
  }
  
  const { onSpec, currentSpec, gameId } = props as Record<string, unknown>;
  
  // Valida onSpec (obrigatório)
  if (typeof onSpec !== "function") {
    errors.push("onSpec deve ser uma função");
  }
  
  // Valida currentSpec (opcional)
  if (currentSpec !== undefined && !isOrdaxSpec(currentSpec)) {
    errors.push("currentSpec deve ser um OrdaxSpec válido");
  }
  
  // Valida gameId (opcional)
  if (gameId !== undefined && typeof gameId !== "string") {
    errors.push("gameId deve ser uma string");
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    errors,
    validatedProps: isValid ? {
      onSpec: onSpec as (spec: OrdaxSpec, raw: string) => void,
      currentSpec: currentSpec as OrdaxSpec | undefined,
      gameId: gameId as string | undefined
    } : null
  };
}

/**
 * Valida estado de ChatStage
 */
export function isValidChatStage(value: unknown): value is 
  "idle" | "planning" | "awaiting_accept" | "generating" | "applying" | "coaching" {
  
  if (typeof value !== "string") return false;
  
  const validStages = [
    "idle",
    "planning", 
    "awaiting_accept",
    "generating",
    "applying",
    "coaching"
  ];
  
  return validStages.includes(value);
}

/**
 * Valida transição de ChatStage
 */
export function isValidStageTransition(
  current: string, 
  next: string
): { isValid: boolean; error?: string } {
  
  if (!isValidChatStage(current)) {
    return {
      isValid: false,
      error: `Stage atual inválido: ${current}`
    };
  }
  
  if (!isValidChatStage(next)) {
    return {
      isValid: false,
      error: `Próximo stage inválido: ${next}`
    };
  }
  
  // Regras de transição
  const validTransitions: Record<string, string[]> = {
    idle: ["planning", "generating", "coaching"],
    planning: ["awaiting_accept", "idle"],
    awaiting_accept: ["generating", "idle"],
    generating: ["applying", "idle"],
    applying: ["idle", "coaching"],
    coaching: ["idle"]
  };
  
  const allowedNextStages = validTransitions[current] || [];
  
  if (!allowedNextStages.includes(next)) {
    return {
      isValid: false,
      error: `Transição inválida: ${current} -> ${next}. Permitido: ${allowedNextStages.join(", ")}`
    };
  }
  
  return { isValid: true };
}

// ============================================================================
// HELPERS DE VALIDAÇÃO
// ============================================================================

/**
 * Valida e parseia JSON com fallback seguro
 */
export function safeJsonParse<T = unknown>(
  jsonString: string, 
  fallback: T
): { success: boolean; data: T; error?: string } {
  
  if (!isNonEmptyString(jsonString)) {
    return {
      success: false,
      data: fallback,
      error: "String JSON vazia"
    };
  }
  
  try {
    const parsed = JSON.parse(jsonString) as T;
    return {
      success: true,
      data: parsed
    };
  } catch (error) {
    return {
      success: false,
      data: fallback,
      error: error instanceof Error ? error.message : "Erro ao parsear JSON"
    };
  }
}

/**
 * Extrai JSON de texto com fallback
 */
export function extractJsonSafely<T = unknown>(
  text: string,
  typeGuard?: (value: unknown) => value is T
): { success: boolean; data: T | null; error?: string } {
  
  if (!isNonEmptyString(text)) {
    return {
      success: false,
      data: null,
      error: "Texto vazio"
    };
  }
  
  // Tenta encontrar JSON no texto
  const jsonStart = text.indexOf("{");
  if (jsonStart === -1) {
    return {
      success: false,
      data: null,
      error: "Nenhum JSON encontrado no texto"
    };
  }
  
  // Encontra o fechamento correspondente
  let braceCount = 0;
  let jsonEnd = -1;
  
  for (let i = jsonStart; i < text.length; i++) {
    if (text[i] === "{") braceCount++;
    else if (text[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        jsonEnd = i;
        break;
      }
    }
  }
  
  if (jsonEnd === -1) {
    return {
      success: false,
      data: null,
      error: "JSON incompleto (fechamento não encontrado)"
    };
  }
  
  const jsonCandidate = text.slice(jsonStart, jsonEnd + 1);
  
  // Parse seguro
  const parseResult = safeJsonParse(jsonCandidate, null);
  if (!parseResult.success) {
    return {
      success: false,
      data: null,
      error: parseResult.error
    };
  }
  
  // Type guard opcional
  if (typeGuard && !typeGuard(parseResult.data)) {
    return {
      success: false,
      data: null,
      error: "JSON não passa no type guard"
    };
  }
  
  return {
    success: true,
    data: parseResult.data as T
  };
}

/**
 * Valida resposta da API do coach
 */
export function validateCoachResponse(data: unknown): {
  isValid: boolean;
  text?: string;
  error?: string;
} {
  if (!isNonNullObject(data)) {
    return {
      isValid: false,
      error: "Resposta não é um objeto"
    };
  }
  
  const response = data as Record<string, unknown>;
  
  // Valida text field
  if (typeof response.text !== "string") {
    return {
      isValid: false,
      error: "Campo 'text' ausente ou inválido"
    };
  }
  
  const text = response.text.trim();
  if (text.length === 0) {
    return {
      isValid: false,
      error: "Campo 'text' vazio"
    };
  }
  
  return {
    isValid: true,
    text
  };
}

// ============================================================================
// CONSTANTES DE VALIDAÇÃO — delegadas ao SSOT studioChatPanelConstants.ts
// ============================================================================

/** @deprecated Use CHAT_CONSTANTS de studioChatPanelConstants.ts diretamente */
export const VALIDATION_CONSTANTS = {
  MAX_MESSAGES: CHAT_CONSTANTS.MAX_INPUT_LENGTH,
  MAX_INPUT_LENGTH: CHAT_CONSTANTS.MAX_INPUT_LENGTH,
  MAX_DEBUG_CONTENT: 10000,
  MAX_RETRY_ATTEMPTS: CHAT_CONSTANTS.AUTO_ADVANCE_MAX_ATTEMPTS,
  DEBOUNCE_MS: 300,
  SCROLL_THRESHOLD_PX: CHAT_CONSTANTS.SCROLL_THRESHOLD_PX,
} as const;

// ============================================================================
// UTILITIES PARA ERROR HANDLING
// ============================================================================

/**
 * Cria erro estruturado para logging
 */
export function createStructuredError(
  context: string,
  error: unknown,
  metadata: Record<string, unknown> = {}
): {
  timestamp: string;
  context: string;
  error: string;
  stack?: string;
  metadata: Record<string, unknown>;
} {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  return {
    timestamp,
    context,
    error: errorMessage,
    stack,
    metadata
  };
}

/**
 * Wrapper seguro para operações async
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string,
  fallback: T
): Promise<{ success: boolean; data: T; error?: string }> {
  try {
    const data = await operation();
    return {
      success: true,
      data
    };
  } catch (error) {
    const structuredError = createStructuredError(context, error);
    console.error(`[StudioChatPanel] ${context} failed:`, structuredError);
    
    return {
      success: false,
      data: fallback,
      error: structuredError.error
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================
// Todos os exports são named exports — não use o default export abaixo.
// Mantido apenas para compatibilidade retroativa.