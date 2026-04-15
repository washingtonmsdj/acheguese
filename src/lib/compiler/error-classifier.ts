/**
 * 🔍 Error Classifier — Classificação de erros do compilador (Fail-Fast System)
 * 
 * Extrai e classifica erros das respostas do backend para decidir:
 * - Se o erro é fatal (parar imediatamente)
 * - Se é recuperável (pode tentar de novo)
 * - Se deve fazer retry
 * 
 * @version 1.0.0
 * @extracted from useCompilerAutoAdvance.ts
 */

import { 
  DELAYS, 
  ERROR_MESSAGES, 
  type CompilerPhase 
} from "@/lib/ordax/constants";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resultado da classificação de erro
 */
export interface ErrorClassification {
  isFatal: boolean;
  isRecoverable: boolean;
  shouldRetry: boolean;
  userMessage: string;
}

/**
 * Estrutura de erro do servidor
 */
export interface ServerError {
  kind?: string;
  error?: string;
  message?: string;
  status?: number;
  context?: {
    status?: number;
    body?: unknown;
  };
}

/**
 * Dados do erro para classificação
 */
export interface ErrorData {
  kind?: string;
  error?: string;
  message?: string;
  status?: number;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO DE ERROS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Classifica erros para sistema fail-fast
 * - Erros fatais: PARAR IMEDIATAMENTE, não tentar de novo
 * - Erros recuperáveis: Pode tentar de novo
 */
export function classifyError(error: unknown, errorData?: unknown): ErrorClassification {
  // Type guard para ServerError
  const serverError = error as ServerError | null;
  const serverErrorData = errorData as ErrorData | null;
  const status = serverError?.context?.status ?? serverError?.status;
  const errorKind = serverErrorData?.kind ?? serverErrorData?.error;
  const errorMessage = serverErrorData?.message ?? serverError?.message ?? "Erro desconhecido";

  // ✅ ERROS FATAL (PARAR IMEDIATAMENTE - NUNCA TENTAR DE NOVO)
  // 400 Bad Request - erro do cliente, dados inválidos
  // 404 Not Found - recurso não existe
  // Erros de validação - dados inválidos
  if (status === 400 || status === 404) {
    return {
      isFatal: true,
      isRecoverable: false,
      shouldRetry: false,
      userMessage: getFatalErrorMessage(errorKind, errorMessage)
    };
  }

  // Erros de contrato semântico, validação, dados inválidos
  const fatalErrorKinds = [
    "MISSING_INTERPRETATION_RESULT",
    "INVALID_INTERPRETATION_RESULT", 
    "INVALID_PHASE_TRANSITION",
    "SESSION_UPDATE_FAILED",
    "PLANNER_INVALID_JSON",
    "VALIDATION_ERROR"
  ];

  if (fatalErrorKinds.includes(errorKind ?? "")) {
    return {
      isFatal: true,
      isRecoverable: false,
      shouldRetry: false,
      userMessage: getFatalErrorMessage(errorKind, errorMessage)
    };
  }

  // ✅ ERROS RECUPERÁVEIS (PODE TENTAR DE NOVO)
  // 429 Too Many Requests - rate limiting
  // 5xx Server Error - erro do servidor
  // Timeout - rede lenta
  // Network error - problemas de conexão
  if (status === 429 || (status && status >= 500) || !status) {
    return {
      isFatal: false,
      isRecoverable: true,
      shouldRetry: true,
      userMessage: getRetryableErrorMessage(errorKind, errorMessage)
    };
  }

  // ✅ DEFAULT: Erro não reconhecido = recuperável (conservador)
  return {
    isFatal: false,
    isRecoverable: true,
    shouldRetry: true,
    userMessage: "Erro temporário. Tentando novamente..."
  };
}

/**
 * Gera mensagem amigável para erros fatais
 */
export function getFatalErrorMessage(kind: string | undefined, message: string): string {
  const messages: Record<string, string> = {
    "MISSING_INTERPRETATION_RESULT": "Dados de interpretação incompletos. Tente reformular sua mensagem.",
    "INVALID_INTERPRETATION_RESULT": "Formato de dados inválido. Tente ser mais específico.",
    "INVALID_PHASE_TRANSITION": "Transição de fase inválida. Reinicie o fluxo.",
    "SESSION_UPDATE_FAILED": "Erro ao salvar sessão. Tente novamente.",
    "PLANNER_INVALID_JSON": "Erro interno do planejador. Tente reformular.",
    "VALIDATION_ERROR": "Dados inválidos detectados. Verifique sua mensagem.",
  };

  return messages[kind ?? ""] ?? `Erro: ${message}. Tente novamente ou reformule sua mensagem.`;
}

/**
 * Gera mensagem amigável para erros recuperáveis
 */
export function getRetryableErrorMessage(kind: string | undefined, message: string): string {
  const messages: Record<string, string> = {
    "RATE_LIMIT": "Muitas requisições. Aguarde um momento e tente novamente.",
    "TIMEOUT": "A conexão demorou muito. Verifique sua internet e tente novamente.",
    "NETWORK_ERROR": "Erro de conexão. Verifique sua internet.",
    "SERVER_ERROR": "Erro temporário do servidor. Tente novamente em alguns segundos.",
  };

  return messages[kind ?? ""] ?? "Erro temporário. Tentando novamente...";
}

/**
 * Calcula delay para retry com backoff exponencial
 */
export function calculateRetryDelay(attemptNumber: number, baseDelayMs: number = DELAYS.RETRY_BASE_MS): number {
  // Backoff exponencial: baseDelay * (2 ^ attempt)
  // attemptNumber começa em 1 para primeira tentativa
  const backoffMultiplier = Math.pow(2, attemptNumber - 1);
  // Jitter aleatório para evitar thundering herd (±25%)
  const jitter = 0.75 + Math.random() * 0.5;
  
  return Math.floor(baseDelayMs * backoffMultiplier * jitter);
}

/**
 * Verifica se um erro é retryable baseado na resposta do servidor
 */
export function isRetryableError(error: unknown): boolean {
  const classification = classifyError(error);
  return classification.shouldRetry;
}

/**
 * Verifica se um erro é fatal
 */
export function isFatalError(error: unknown): boolean {
  const classification = classifyError(error);
  return classification.isFatal;
}
