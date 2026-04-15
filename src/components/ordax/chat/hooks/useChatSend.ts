import { useCallback } from "react";
import { toast } from "sonner";
import type { OrdaxSpec, ChatMsg, CompilerResponse } from "@/lib/ordax/types";
import { invokePlanner } from "@/lib/services/gameAiChatService";
import { contextManager } from "@/lib/ordax/context-manager";
import { CHAT_MESSAGES } from "@/components/ordax/studioChatPanelConstants";

import type { UseChatStateReturn } from "./useChatState";
import type { UseStreamingGenerationReturn } from "./useStreamingGeneration";

export interface UseChatSendProps {
  chatState: UseChatStateReturn;
  streamingGeneration: UseStreamingGenerationReturn;
  autoAdvanceHook: { autoAdvance: (sessionId: string, messages: ChatMsg[], nextPhase: string) => Promise<void> };
  onSpec: (spec: OrdaxSpec, raw: string) => void;
  currentSpec?: OrdaxSpec;
  gameId?: string;
}

export interface UseChatSendReturn {
  // Main send function
  send: (text: string) => Promise<void>;
  
  // Generation functions
  generateSpecStreaming: (
    fullMessages: ChatMsg[], 
    spec?: OrdaxSpec, 
    approvedPlan?: unknown, 
    sessionIdParam?: string | null
  ) => Promise<void>;
  
  // Fallback function
  useFallbackSpec: (
    fullMessages: ChatMsg[], 
    spec?: OrdaxSpec, 
    approvedPlan?: unknown
  ) => Promise<void>;
  
  // Helper functions
  handleCompilerResponse: (response: CompilerResponse) => boolean;
  validateMessagesForBackend: (messages: ChatMsg[]) => boolean;
}

export const useChatSend = ({
  chatState,
  streamingGeneration,
  autoAdvanceHook,
  onSpec,
  currentSpec,
  gameId
}: UseChatSendProps): UseChatSendReturn => {
  const {
    // State
    isLoading,
    isEditMode,
    messagesRef,
    userIdRef,
    lastUserPromptRef,
    
    // Actions
    resetCompilerState,
    setCompilerPhase,
    setSessionId,
    setMessages,
    setInput,
    setIsLoading,
    setStage,
    setIsStreaming,
    setStreamingContent,
    setDebugError,
    setDebugRaw,
    setDebugSanitized,
    setDebugFixes,
    setPlanResult,
    setPendingNewGameMessages,
    setPlanReviewOpen,
    addResponse,
    
    // Derived
    isCodeMutatorMode,
    codeEntryPath,
  } = chatState;

  const {
    // Streaming functions
    streamWithClient,
    parseStreamingResult,
  } = streamingGeneration;

  // Generation function - delega para useStreamingGeneration
  const generateSpecStreaming = useCallback(async (
    fullMessages: ChatMsg[], 
    spec?: OrdaxSpec, 
    approvedPlan?: unknown, 
    sessionIdParam?: string | null
  ) => {
    console.log('[useChatSend] generateSpecStreaming chamado, delegando para streamWithClient');
    // Delega para a implementação real em useStreamingGeneration
    return streamWithClient(fullMessages, spec, approvedPlan, sessionIdParam);
  }, [streamWithClient]);

  // Main send function
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    console.log('[StudioChatPanel] send() chamado:', { text: trimmed, isEditMode, isLoading });

    // Use the latest messages (avoid stale state when called from timers).
    const baseMessages = messagesRef.current;

    // Reset compiler state para novo jogo
    if (!isEditMode) {
      console.log('[StudioChatPanel] Resetando compiler state (NEW_GAME)');
      resetCompilerState();
      setCompilerPhase("interpretation");
      setSessionId(null);
    } else {
      console.log('[StudioChatPanel] Modo EDIT - mantendo compiler state');
    }

    // IMPORTANT:
    // React state updates above are async; during this `send()` call, `compilerPhase` and `sessionId`
    // variables may still hold OLD values from a previous session (e.g. confirmation/compilation).
    // If we reuse them, the backend will load the old session and reject transitions like
    // `compilation -> confirmation`.
    const newGamePhaseOverride: CompilerResponse['phase'] = "interpretation";
    const newGameSessionIdOverride: string | undefined = undefined;

    const userMessage: ChatMsg = { role: "user", content: trimmed };
    lastUserPromptRef.current = trimmed;
    setMessages((prev) => [...prev, userMessage]);
    contextManager.addMessage(userMessage);
    setInput("");
    setIsLoading(true);
    setStage(isEditMode ? "generating" : "planning");
    setIsStreaming(false);
    setStreamingContent("");
    // If user was already at the bottom, keep following the stream.
    // If not, don't force-scroll while they read older messages.
    chatState.shouldStickToBottomRef.current = true;

    // Reset debug state for this run
    setDebugError("");
    setDebugRaw("");
    setDebugSanitized("");
    setDebugFixes("");

    // NEW_GAME now has a mandatory planning gate.
    if (!isEditMode) {
      console.log('[StudioChatPanel] Modo NEW_GAME - iniciando planning');
      try {
        const callPlanner = async (plannerMessages: ChatMsg[]) => {
          // NEW_GAME: Never reuse possibly-stale `compilerPhase/sessionId` from previous runs.
          // The first request must always start at interpretation with no sessionId.
          const phaseToSend = newGamePhaseOverride;
          const sessionIdToSend = newGameSessionIdOverride;
          console.log('[StudioChatPanel] Chamando game-ai-chat (phase:', phaseToSend, ', sessionId:', sessionIdToSend, ')');
          return await invokePlanner(
            plannerMessages,
            userIdRef.current,
            { timeoutMs: 30000, retries: 1 }
          );
        };

        const plannerMessages = [...baseMessages, userMessage];
        const { data, error } = await callPlanner(plannerMessages);

        console.log('[StudioChatPanel] Resposta do planner:', { hasData: !!data, hasError: !!error, data });

        setIsLoading(false);

        if (error) {
          toast.error(`Erro: ${error.message}`);
          return;
        }

        // Detectar resposta estruturada do compilador
        const responseKind = (data as Record<string, unknown>)?.kind;
        console.log('[StudioChatPanel] Response kind:', responseKind);

        if (responseKind) {
          // Resposta estruturada do protocolo do compilador
          const compilerResponse = data as CompilerResponse;
          
          // ✅ CORREÇÃO #2: Validar duplicatas ANTES de adicionar resposta
          const isDuplicate = chatState.compilerResponses.some(r => 
            r.kind === compilerResponse.kind && 
            r.phase === compilerResponse.phase &&
            r.sessionId === compilerResponse.sessionId
          );

          if (isDuplicate) {
            console.log('[StudioChatPanel] ⚠️ Resposta duplicada detectada, ignorando:', {
              kind: compilerResponse.kind,
              phase: compilerResponse.phase,
              sessionId: compilerResponse.sessionId
            });
            return;
          }
          
          // Atualizar fase e sessionId
          if (compilerResponse.phase) {
            setCompilerPhase(compilerResponse.phase);
          }
          if (compilerResponse.sessionId) {
            setSessionId(compilerResponse.sessionId);
          }

          // Adicionar resposta estruturada
          console.log('[StudioChatPanel] Adicionando resposta:', {
            kind: compilerResponse.kind,
            phase: compilerResponse.phase,
            sessionId: compilerResponse.sessionId,
            timestamp: Date.now()
          });
          
          addResponse(compilerResponse);

          // Tratamento de erros de contrato
          if (responseKind === "PLANNER_INVALID_OUTPUT") {
            toast.error(CHAT_MESSAGES.ERRORS.PLANNER_INVALID_OUTPUT);
            return;
          }

          if (responseKind === "SEMANTIC_CONTRACT_VIOLATION") {
            const violation = compilerResponse as Record<string, unknown>;
            const userMessage = typeof violation.userMessage === 'string' ? violation.userMessage : 
                               typeof violation.message === 'string' ? violation.message : 
                               CHAT_MESSAGES.ERRORS.SEMANTIC_CONTRACT_VIOLATION;
            toast.error(userMessage);
            return;
          }

          // Se for CONFIRMATION_REQUIRED, parar aqui (usuário precisa aprovar)
          if (responseKind === "CONFIRMATION_REQUIRED") {
            setStage("awaiting_accept");
            return;
          }

          // Se for fase intermediária, continuar automaticamente
          if (responseKind === "INTERPRETATION_RESULT" || 
              responseKind === "GAME_PLAN_RESULT" || 
              responseKind === "VALIDATION_RESULT") {
            // Continue without changing user-visible message history.
            // Attempt a few times to advance the compiler session to CONFIRMATION_REQUIRED.
            const currentSessionId = compilerResponse.sessionId;
            const nextPhase = (compilerResponse as Record<string, unknown>).nextPhase;
            
            // ✅ CORREÇÃO #3: Validar parâmetros ANTES de chamar autoAdvance
            if (!currentSessionId) {
              console.error('[StudioChatPanel] ❌ Não pode avançar: sessionId ausente');
              return;
            }
            
            if (!messagesRef.current || messagesRef.current.length === 0) {
              console.error('[StudioChatPanel] ❌ Não pode avançar: messages vazio');
              return;
            }
            
            if (!nextPhase) {
              console.error('[StudioChatPanel] ❌ Não pode avançar: nextPhase ausente');
              return;
            }
            
            // ✅ CORREÇÃO CRÍTICA: Usar plannerMessages (que inclui a mensagem do usuário recém-adicionada)
            // em vez de messagesRef.current (que pode não ter sido atualizado ainda pelo React)
            console.log('[StudioChatPanel] ✅ Iniciando autoAdvance:', {
              sessionId: currentSessionId,
              messagesCount: plannerMessages.length,
              nextPhase
            });
            
            // Chamar autoAdvance para continuar o fluxo
            try {
              await autoAdvanceHook.autoAdvance(currentSessionId, plannerMessages, nextPhase);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              console.error('[StudioChatPanel] ❌ Erro no autoAdvance:', err);
              toast.error(CHAT_MESSAGES.ERRORS.PLANNER_FAILED + ' autoAdvance: ' + errorMessage);
            }
            return;
          }

          return;
        }

        // Fallback para formato antigo (legacy)
        console.log('[StudioChatPanel] Usando fallback legacy, data:', data);
        
        // Por enquanto, vamos simplificar e chamar generateSpecStreaming diretamente
        // para manter a refatoração focada
        await generateSpecStreaming(plannerMessages, undefined, undefined, undefined);
        
        // ✅ CORREÇÃO: Garantir que loading seja resetado
        // O generateSpecStreaming já chama setIsLoading(false) internamente,
        // mas adicionamos aqui como fallback seguro
        setIsLoading(false);
        
      } catch (e) {
        setIsLoading(false);
        setStage("idle");
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`${CHAT_MESSAGES.ERRORS.PLANNER_FAILED} ${msg}`);
        setDebugError(msg);
      }
      return;
    }

    // EDIT mode: generate immediately
    console.log('[StudioChatPanel] Modo EDIT - gerando spec com streaming');
    await generateSpecStreaming([...baseMessages, userMessage], currentSpec, undefined, chatState.sessionId);
  }, [
    isLoading,
    isEditMode,
    messagesRef,
    currentSpec,
    chatState.sessionId,
    chatState.compilerResponses,
    userIdRef,
    lastUserPromptRef,
    resetCompilerState,
    setCompilerPhase,
    setSessionId,
    setMessages,
    setInput,
    setIsLoading,
    setStage,
    setIsStreaming,
    setStreamingContent,
    setDebugError,
    setDebugRaw,
    setDebugSanitized,
    setDebugFixes,
    setPlanResult,
    setPendingNewGameMessages,
    setPlanReviewOpen,
    addResponse,
    generateSpecStreaming,
    contextManager,
    chatState.shouldStickToBottomRef,
    autoAdvanceHook,
  ]);

  // Fallback function - delega para useStreamingGeneration
  const useFallbackSpecWrapper = useCallback(async (
    fullMessages: ChatMsg[], 
    spec?: OrdaxSpec, 
    approvedPlan?: unknown
  ) => {
    console.log('[useChatSend] useFallbackSpec chamado, delegando para streamingGeneration');
    // Delega para a implementação em useStreamingGeneration
    return streamingGeneration.useFallbackSpec(fullMessages, spec, approvedPlan);
  }, [streamingGeneration]);

  // Helper functions
  const handleCompilerResponse = useCallback((response: CompilerResponse): boolean => {
    // Implementação simplificada por enquanto
    console.log('[useChatSend] handleCompilerResponse:', response.kind);
    return true;
  }, []);

  const validateMessagesForBackend = useCallback((messages: ChatMsg[]): boolean => {
    return messages.every(msg => 
      msg.role === "user" || msg.role === "assistant" || msg.role === "system"
    ) && messages.length > 0;
  }, []);

  return {
    send,
    generateSpecStreaming,
    useFallbackSpec: useFallbackSpecWrapper,
    handleCompilerResponse,
    validateMessagesForBackend,
  };
};