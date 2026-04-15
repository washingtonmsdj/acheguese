import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { invokeCompilerPhase } from "@/lib/services/gameAiChatService";
import type { CompilerResponse } from "@/components/ordax/CompilerPhaseRenderer";
import { logSuccess, logError, logCall, logWarning } from "@/components/ordax/DebugLogPanel";
import { 
  DELAYS, 
  TIMEOUTS, 
  LIMITS, 
  ERROR_MESSAGES, 
  VALID_COMPILER_PHASES,
  type CompilerPhase 
} from "@/lib/ordax/constants";

// ✅ Tipos
// Nota: autoAdvance é usado apenas para fluxo de novo jogo (interpretation → plan → validation → confirmation)
// Nesse fluxo, não usamos mensagens com role: "system"
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Gerador de requestId simples (compatível com browser)
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// ✅ CLASSIFICAÇÃO DE ERROS - FAIL-FAST SYSTEM
interface ErrorClassification {
  isFatal: boolean;
  isRecoverable: boolean;
  shouldRetry: boolean;
  userMessage: string;
}

/**
 * Estrutura de erro do servidor
 */
interface ServerError {
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
 * Classifica erros para sistema fail-fast
 * - Erros fatais: PARAR IMEDIATAMENTE, não tentar de novo
 * - Erros recuperáveis: Pode tentar de novo
 */
function classifyError(error: unknown, errorData?: unknown): ErrorClassification {
  // Type guard para ServerError
  const serverError = error as ServerError | null;
  const serverErrorData = errorData as ServerError | null;
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
    // ✅ REMOVIDO: "SEMANTIC_CONTRACT_VIOLATION" - agora o backend auto-completa planos incompletos
    "VALIDATION_ERROR"
  ];

  if (fatalErrorKinds.includes(errorKind)) {
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
  const isTransient = status === 429 || (status !== undefined && status >= 500);
  const errorMsg = serverError?.message ?? "";
  const isNetworkError = errorMsg.includes("network") || 
                        errorMsg.includes("timeout") ||
                        errorMsg.includes("fetch");

  if (isTransient || isNetworkError) {
    return {
      isFatal: false,
      isRecoverable: true,
      shouldRetry: true,
      userMessage: "Problema temporário. Tentando novamente..."
    };
  }

  // ✅ ERRO DESCONHECIDO (assume fatal para segurança)
  return {
    isFatal: true,
    isRecoverable: false,
    shouldRetry: false,
    userMessage: "Erro inesperado. Por favor, tente novamente."
  };
}

/**
 * Mensagens amigáveis para erros fatais
 */
function getFatalErrorMessage(errorKind: string, errorMessage: string): string {
  switch (errorKind) {
    case "MISSING_INTERPRETATION_RESULT":
      return "Houve um problema ao processar sua solicitação. Por favor, tente criar o jogo novamente.";
    case "SESSION_UPDATE_FAILED":
      return "Erro ao salvar progresso. Verifique sua conexão e tente novamente.";
    case "INVALID_PHASE_TRANSITION":
      return "Erro no fluxo de criação do jogo. Por favor, recarregue a página e tente novamente.";
    case "INVALID_INTERPRETATION_RESULT":
      return "Erro ao interpretar sua solicitação. Por favor, tente descrever o jogo de outra forma.";
    case "PLANNER_INVALID_JSON":
      return "Erro ao gerar plano do jogo. Por favor, tente novamente.";
    // ✅ REMOVIDO: "SEMANTIC_CONTRACT_VIOLATION" - não é mais um erro fatal
    default:
      return `Erro: ${errorMessage}`;
  }
}

/**
 * Estrutura de dados de erro parseada
 */
interface ParsedErrorData {
  error?: string;
  kind?: string;
  message?: string;
  raw?: string;
  [key: string]: unknown;
}

// ✅ Helper para processar error body
async function handleErrorBody(errorBodyData: unknown, phaseToSend: string, requestId: string): Promise<ErrorClassification> {
  let errorData: ParsedErrorData = {};
  
  // ✅ CORREÇÃO CRÍTICA: Se for ReadableStream, ler o conteúdo
  if (errorBodyData && typeof errorBodyData === 'object' && 'text' in errorBodyData && typeof (errorBodyData as unknown as { text: () => Promise<string> }).text === 'function') {
    try {
      const text = await (errorBodyData as unknown as { text: () => Promise<string> }).text();
      // Log via DebugLogPanel se necessário
      
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch {
          // Se não for JSON, usar como string
          errorData = { error: text, raw: text.substring(0, 200) };
        }
      }
    } catch (streamError) {
      logError("useCompilerAutoAdvance", "Erro ao ler ReadableStream", streamError instanceof Error ? streamError : new Error(String(streamError)));
      errorData = { error: "Failed to read error response" };
    }
  }
  // Se for string, tentar parsear
  else if (typeof errorBodyData === 'string') {
    try {
      errorData = JSON.parse(errorBodyData);
    } catch {
      // Error body não é JSON - tratado abaixo
      errorData = { error: errorBodyData.substring(0, 200) };
    }
  }
  
  // Processar erro
  // Error processado, será logado via DebugLogPanel abaixo
  
  // ✅ Classificar erro
  const classification = classifyError(null, errorData);
  
  // ✅ Mostrar mensagem apropriada
  if (classification.isFatal) {
    toast.error(classification.userMessage);
  } else {
    toast.warning(classification.userMessage);
  }

  // Log estruturado via DebugLogPanel
  logError(
    "useCompilerAutoAdvance",
    "Erro técnico classificado",
    new Error(errorData.message ?? errorData.error ?? "Unknown"),
    {
      classification,
      kind: errorData.kind ?? errorData.error,
      message: errorData.message ?? errorData.error,
    phase: phaseToSend,
    requestId,
    fullError: errorData
  });
  
  logError(
    "useCompilerAutoAdvance",
    "Detalhes do erro estruturado",
    new Error(errorData.message ?? errorData.error ?? "Unknown error"),
    {
      ...errorData,
      phase: phaseToSend,
      requestId,
      errorBodyType: typeof errorBodyData,
      hasTextMethod: errorBodyData && typeof errorBodyData === 'object' && 'text' in errorBodyData,
      classification,
      userMessage: classification.userMessage
    },
    phaseToSend as CompilerPhase
  );

  return classification;
}

interface UseCompilerAutoAdvanceProps {
  sessionId: string;
  messages: ChatMessage[];  // ✅ Tipo específico ao invés de any
  userId?: string;
  onPhaseChange: (phase: string) => void;
  onResponseReceived: (response: CompilerResponse) => void;
  onConfirmationRequired: () => void;
}

/**
 * Hook para gerenciar o autoAdvance do compilador através das fases
 * Mantém estado entre chamadas assíncronas usando refs
 */
export function useCompilerAutoAdvance({
  sessionId,
  messages,
  userId,
  onPhaseChange,
  onResponseReceived,
  onConfirmationRequired,
}: UseCompilerAutoAdvanceProps) {
  const currentPhaseRef = useRef<string>("interpretation");
  const isRunningRef = useRef(false);
  const lastRequestIdRef = useRef<string>("");
  const pendingPhasesRef = useRef<Map<string, string>>(new Map()); // requestId -> phase

  const phaseMap: Record<string, string> = {
    interpretation: "plan",
    plan: "validation",
    validation: "confirmation",
    confirmation: "compilation",
  };

  // Função interna que mantém a lógica de retry com attemptsLeft
  const advanceInternal = useCallback(
    async (
      attemptsLeft: number,
      currentMessages: ChatMessage[],
      currentSessionId: string,
      currentPhase: string
    ): Promise<void> => {
      // ✅ CORREÇÃO CRÍTICA #1: Verificar E setar isRunning atomicamente
      if (isRunningRef.current) {
        logWarning(
          "useCompilerAutoAdvance",
          "Tentativa de chamada duplicada bloqueada (race condition evitada)",
          { attemptsLeft, phase: currentPhase },
          currentPhase as unknown as CompilerPhase
        );
        return;
      }
      
      // ✅ Setar isRunning IMEDIATAMENTE (antes de qualquer await)
      isRunningRef.current = true;
      
      if (attemptsLeft <= 0) {
        logWarning("useCompilerAutoAdvance", "Esgotou tentativas sem chegar a CONFIRMATION_REQUIRED");
        isRunningRef.current = false;
        return;
      }

      // ✅ Validar parâmetros obrigatórios (com reset se falhar)
      if (!currentSessionId) {
        logError("useCompilerAutoAdvance", "sessionId é obrigatório", new Error("Missing sessionId"));
        toast.error("Erro interno: sessionId é obrigatório");
        isRunningRef.current = false;
        return;
      }
      
      if (!currentMessages || currentMessages.length === 0) {
        logError("useCompilerAutoAdvance", "messages é obrigatório", new Error("Missing messages"));
        toast.error("Erro interno: messages é obrigatório");
        isRunningRef.current = false;
        return;
      }
      
      // ✅ Validar estrutura das mensagens
      for (const msg of currentMessages) {
        if (!msg.role || !msg.content) {
          logError("useCompilerAutoAdvance", "Mensagem inválida", new Error("Invalid message structure"), { msg });
          toast.error("Erro interno: mensagem inválida");
          isRunningRef.current = false;
          return;
        }
        
        // ✅ Validar role específica - apenas "user" ou "assistant" para autoAdvance
        if (msg.role !== "user" && msg.role !== "assistant") {
          logError("useCompilerAutoAdvance", "Role inválida para autoAdvance", new Error("Invalid role"), { role: msg.role });
          toast.error("Erro interno: role inválida para autoAdvance");
          isRunningRef.current = false;
          return;
        }
        
        // ✅ Validar content é string
        if (typeof msg.content !== 'string') {
          logError("useCompilerAutoAdvance", "Content não é string", new Error("Invalid content type"), { contentType: typeof msg.content });
          toast.error("Erro interno: content não é string");
          isRunningRef.current = false;
          return;
        }
      }
      
      // ✅ Validar última mensagem é do usuário
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage.role !== "user") {
        logError("useCompilerAutoAdvance", "Última mensagem deve ser do usuário", new Error("Last message not from user"));
        toast.error("Erro interno: última mensagem deve ser do usuário");
        isRunningRef.current = false;
        return;
      }
      
      if (!currentPhase) {
        logError("useCompilerAutoAdvance", "phase é obrigatório", new Error("Missing phase"));
        toast.error("Erro interno: phase é obrigatório");
        isRunningRef.current = false;
        return;
      }
      
      // ✅ Validar se phase é válido
      if (!VALID_COMPILER_PHASES.includes(currentPhase as CompilerPhase)) {
        logError("useCompilerAutoAdvance", "phase inválido", new Error("Invalid phase"), { phase: currentPhase });
        toast.error(ERROR_MESSAGES.INVALID_PHASE(currentPhase));
        isRunningRef.current = false;
        return;
      }
      
      // ✅ Validar sessionId formato
      if (typeof currentSessionId !== 'string' || currentSessionId.trim().length === 0) {
        logError("useCompilerAutoAdvance", "sessionId inválido", new Error("Invalid sessionId"), { sessionId: currentSessionId });
        toast.error("Erro interno: sessionId inválido");
        isRunningRef.current = false;
        return;
      }
      
      // ✅ Log de validação bem-sucedida via DebugLogPanel
      logCall("useCompilerAutoAdvance", "validation", "Parâmetros validados", {
        sessionId: currentSessionId,
        phase: currentPhase,
        messageCount: currentMessages.length,
        attemptsLeft
      });

      // ✅ Gerar requestId para esta request
      const requestId = generateRequestId();
      lastRequestIdRef.current = requestId;
      pendingPhasesRef.current.set(requestId, currentPhase);

      const timestamp = Date.now();

      try {
        // ✅ Validar phaseMap
        const phaseToSend = currentPhase;
        const nextPhaseAfterThis = phaseMap[currentPhase];
        if (!nextPhaseAfterThis) {
          logError("useCompilerAutoAdvance", "Phase inválido no phaseMap", new Error("Invalid phase in phaseMap"), { phase: currentPhase });
          pendingPhasesRef.current.delete(requestId);
          isRunningRef.current = false;
          return;
        }

        // Logs convertidos para logCall estruturado abaixo

        logCall(
          "useCompilerAutoAdvance",
          "game-ai-chat",
          `Tentativa ${4 - attemptsLeft}/3 - Enviando fase ${phaseToSend}`,
          {
            requestId,
            phase: phaseToSend,
            nextPhase: nextPhaseAfterThis,
            sessionId: currentSessionId,
            messageCount: currentMessages.length,
            attempt: 4 - attemptsLeft
          },
          phaseToSend as unknown as CompilerPhase
        );

        // ✅ Usar serviço centralizado para invocar edge function
        const { data, error } = await invokeCompilerPhase(
          phaseToSend,
          currentMessages,
          currentSessionId,
          userId,
          requestId,
          { timeoutMs: TIMEOUTS.EDGE_FUNCTION_INVOKE_MS, retries: 0 }
        );

        if (error) {
          // ✅ SEMPRE limpar pendingPhasesRef em caso de erro
          pendingPhasesRef.current.delete(requestId);
          
          // Erro já será logado via logError abaixo
          
          logError(
            "useCompilerAutoAdvance",
            "Erro ao chamar game-ai-chat",
            error,
            {
              phase: phaseToSend,
              sessionId: currentSessionId,
              requestId,
              attempt: 4 - attemptsLeft,
              status: (error as { context?: { status?: number } })?.context?.status
            },
            phaseToSend as unknown as CompilerPhase
          );
          
          // Tentar ler o response body para ver o erro detalhado
          const serverErr = error as ServerError;
          const ctx = serverErr?.context;
          if (ctx?.body) {
            try {
              let errorBodyData = ctx.body;
              
              // ✅ CORREÇÃO: Ler ReadableStream corretamente
              if (errorBodyData instanceof ReadableStream) {
                const reader = errorBodyData.getReader();
                const decoder = new TextDecoder();
                let result = '';
                
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  result += decoder.decode(value, { stream: true });
                }
                
                errorBodyData = result;
                
                // Tentar parsear como JSON
                try {
                  errorBodyData = JSON.parse(result);
                } catch {
                  // Se não for JSON, usar como string
                  errorBodyData = { error: result };
                }
              }
              // Se for Response, usar .text()
              else if (errorBodyData && typeof (errorBodyData as Response).text === 'function') {
                const text = await (errorBodyData as Response).text();
                try {
                  errorBodyData = JSON.parse(text);
                } catch {
                  errorBodyData = { error: text };
                }
              }
              
              // Error body processado pelo handleErrorBody
              
              // ✅ Usar helper para processar erro (agora assíncrono) e classificar
              const classification = await handleErrorBody(errorBodyData, phaseToSend, requestId);
              
              // ✅ SISTEMA FAIL-FAST: Decidir ação baseado na classificação
              if (classification.isFatal) {
                // ✅ ERRO FATAL: PARAR IMEDIATAMENTE, NÃO TENTAR DE NOVO
                // Erro fatal já logado via logError acima
                
                logError(
                  "useCompilerAutoAdvance",
                  "Erro fatal - parando fluxo",
                  new Error(classification.userMessage),
                  {
                    classification,
                    phase: currentPhase,
                    sessionId: currentSessionId,
                    attemptsLeft,
                    requestId
                  },
                  currentPhase as unknown as CompilerPhase
                );
                
                // ✅ Limpar pendingPhasesRef
                pendingPhasesRef.current.delete(requestId);
                isRunningRef.current = false;
                return; // ✅ PARA AQUI - NÃO CONTINUA
              }
              
              // ✅ ERRO RECUPERÁVEL: Pode tentar de novo
              if (classification.shouldRetry && attemptsLeft > 1) {
                const delayMs = (4 - attemptsLeft) * DELAYS.RETRY_BASE_MS + DELAYS.RETRY_BASE_MS;
                // Retry será logado via logWarning abaixo
                
                logWarning(
                  "useCompilerAutoAdvance",
                  "Erro recuperável, agendando retry",
                  {
                    classification,
                    attemptsLeft,
                    delayMs,
                    phase: currentPhase,
                    sessionId: currentSessionId
                  },
                  currentPhase as unknown as CompilerPhase
                );
                
                window.setTimeout(() => {
                  isRunningRef.current = false;
                  void advanceInternal(attemptsLeft - 1, currentMessages, currentSessionId, currentPhase);
                }, delayMs);
                return;
              }
            } catch (readError) {
              logError("useCompilerAutoAdvance", "Não conseguiu ler error body", readError instanceof Error ? readError : new Error(String(readError)));
            }
          } else {
            // ✅ Se não tem body, classificar baseado no erro bruto
            const classification = classifyError(error);
            
            if (classification.isFatal) {
              // ✅ ERRO FATAL: PARAR IMEDIATAMENTE
              toast.error(classification.userMessage);
              
              // Erro fatal sem body - já logado via classifyError
              
              // ✅ Limpar pendingPhasesRef
              pendingPhasesRef.current.delete(requestId);
              isRunningRef.current = false;
              return; // ✅ PARA AQUI
            }
            
            // ✅ ERRO RECUPERÁVEL
            toast.warning(classification.userMessage);
          }

          // ✅ Se chegou aqui, é erro não classificado ou sem retry disponível
          // ✅ Limpar pendingPhasesRef em caso de erro
          pendingPhasesRef.current.delete(requestId);
          isRunningRef.current = false;
          return;
        }

        interface ResponseData {
          kind?: string;
          phase?: string;
          requestId?: string;
          nextPhase?: string;
          message?: string;
          error?: string;
          [key: string]: unknown;
        }
        
        const responseData = data as ResponseData;
        const kind = responseData?.kind;
        const phaseResponse = responseData?.phase;
        const responseRequestId = responseData?.requestId;
        const responseTimestamp = Date.now();
        const latency = responseTimestamp - timestamp;

        // Response recebida - logado via logSuccess abaixo

        logSuccess(
          "useCompilerAutoAdvance",
          `Resposta recebida: ${kind}`,
          {
            kind,
            phase: phaseResponse,
            requestId: responseRequestId,
            latency: `${latency}ms`,
            sessionId: currentSessionId
          },
          phaseResponse as unknown as PhaseResponse
        );

        // ✅ FILTRO #1: Ignorar respostas sem requestId (compatibilidade com backend antigo)
        if (!responseRequestId) {
          // Resposta sem requestId - logado via logWarning abaixo
          logWarning(
            "useCompilerAutoAdvance",
            "Resposta sem requestId (backend antigo?)",
            { kind, phase: phaseResponse },
            phaseResponse as unknown as PhaseResponse
          );
        }

        // ✅ FILTRO #2: Ignorar respostas de requests anteriores (race condition)
        if (responseRequestId && responseRequestId !== requestId) {
          logWarning("useCompilerAutoAdvance", "Ignorando resposta de request anterior (race condition)", {
            expectedRequestId: requestId,
            receivedRequestId: responseRequestId,
            expectedPhase: phaseToSend,
          });
          logWarning(
            "useCompilerAutoAdvance",
            "Ignorando resposta de request anterior (race condition)",
            {
              expectedRequestId: requestId,
              receivedRequestId: responseRequestId,
              expectedPhase: phaseToSend,
              receivedPhase: phaseResponse
            },
            phaseResponse as unknown as PhaseResponse
          );
          isRunningRef.current = false;
          return;
        }

        // ✅ FILTRO #3: Validar que a resposta tem a fase correta
        if (phaseResponse !== phaseToSend) {
          logError("useCompilerAutoAdvance", "PHASE MISMATCH", new Error("Phase mismatch"), {
            expectedPhase: phaseToSend,
            receivedPhase: phaseResponse,
            kind,
            requestId,
          });
          
          // ✅ Limpar pendingPhasesRef
          pendingPhasesRef.current.delete(requestId);
          
          toast.error(`Erro de fase: esperava ${phaseToSend}, recebeu ${phaseResponse}`);
          isRunningRef.current = false;
          return;
        }

        // ✅ Validar kind
        if (!kind) {
          
          // ✅ Limpar pendingPhasesRef
          pendingPhasesRef.current.delete(requestId);
          
          // ✅ Notificar usuário
          toast.error("Erro: resposta inválida do servidor");
          
          // ✅ Logar erro
          logError(
            "useCompilerAutoAdvance",
            "Resposta sem kind",
            new Error("Response missing kind field"),
            { data, requestId },
            phaseToSend as unknown as CompilerPhase
          );
          
          isRunningRef.current = false;
          return;
        }

        // Backend pode retornar erro estruturado (HTTP 200) para não virar "error" no supabase-js.
        if (kind === "COMPILER_ERROR") {
          const msg = responseData?.message ?? responseData?.error ?? "Erro no compilador";
          const errorKind = responseData?.error;
          
          // COMPILER_ERROR será logado via logError abaixo
          
          // ✅ Classificar erro COMPILER_ERROR
          const classification = classifyError(null, data);
          
          if (classification.isFatal) {
            // ✅ ERRO FATAL: PARAR IMEDIATAMENTE
            // Erro fatal já notificado via toast e logError abaixo
            
            toast.error(classification.userMessage);
            isRunningRef.current = false;
            
            // ✅ Limpar pendingPhasesRef
            pendingPhasesRef.current.delete(requestId);
            
            // Ainda registra a resposta para UI (renderer/inspeção)
            onResponseReceived(data as CompilerResponse);
            return; // ✅ PARA AQUI - NÃO CONTINUA
          } else {
            // ✅ ERRO RECUPERÁVEL
            // Erro recuperável já notificado via toast
            
            toast.warning(classification.userMessage);
            isRunningRef.current = false;
            
            // ✅ Limpar pendingPhasesRef
            pendingPhasesRef.current.delete(requestId);
            
            // Ainda registra a resposta para UI
            onResponseReceived(data as CompilerResponse);
            return; // ✅ PARA - mas é recuperável (usuário pode tentar de novo)
          }
        }

        const response = data as CompilerResponse;

        // Notificar que recebeu resposta
        onResponseReceived(response);

        // Se chegou a CONFIRMATION_REQUIRED, parar
        if (kind === "CONFIRMATION_REQUIRED") {
          onConfirmationRequired();
          isRunningRef.current = false;
          return;
        }

        // Se é uma fase intermediária, avançar para a próxima e continuar
        if (
          kind === "INTERPRETATION_RESULT" ||
          kind === "PLAN_RESULT" ||           // ✅ Aceitar PLAN_RESULT
          kind === "GAME_PLAN_RESULT" ||      // ✅ Manter compatibilidade
          kind === "VALIDATION_RESULT"
        ) {
          // Avançar para a próxima fase
          const nextPhaseFromResponse = responseData.nextPhase ?? phaseMap[currentPhase];
          // Fase será atualizada - logado via onPhaseChange
          if (nextPhaseFromResponse) {
            currentPhaseRef.current = nextPhaseFromResponse;
            onPhaseChange(nextPhaseFromResponse);
            // Fase atualizada com sucesso
          }

          // ✅ Limpar requestId antigo antes de avançar
          pendingPhasesRef.current.delete(requestId);

          window.setTimeout(() => {
            isRunningRef.current = false;
            void advanceInternal(attemptsLeft - 1, currentMessages, currentSessionId, nextPhaseFromResponse);
          }, DELAYS.PHASE_ADVANCE_MS);  // ✅ Usar constante
          return;
        }

        isRunningRef.current = false;
      } catch (error) {
        // Erro será logado via logError abaixo
        
        // ✅ Limpar pendingPhasesRef
        pendingPhasesRef.current.delete(requestId);
        
        // ✅ Notificar usuário
        toast.error("Erro inesperado ao processar resposta");
        
        // ✅ Logar erro
        logError(
          "useCompilerAutoAdvance",
          "Erro inesperado",
          error instanceof Error ? error : new Error(String(error)),
          { requestId, phase: currentPhase },
          currentPhase as unknown as CompilerPhase
        );
        
        isRunningRef.current = false;
      }
    },
    [messages, userId, sessionId, onPhaseChange, onResponseReceived, onConfirmationRequired]
  );

  // Função pública com assinatura limpa (SSOT: alinhada com interface)
  const autoAdvance = useCallback(
    async (
      sessionId: string,
      messages: ChatMessage[],
      nextPhase: string
    ): Promise<void> => {
      return advanceInternal(3, messages, sessionId, nextPhase);
    },
    [advanceInternal]
  );

  return {
    autoAdvance,
    setCurrentPhase: (phase: string) => {
      currentPhaseRef.current = phase;
    },
    getCurrentPhase: () => currentPhaseRef.current,
  };
}
