import { useEffect, useCallback, useMemo, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OrdaxSpec, CompilerPhase } from "@/lib/ordax/types";
import { PlanReviewDrawer } from "@/components/ordax/PlanReviewDrawer";
import { DebugLogPanel } from "@/components/ordax/DebugLogPanel";
import { contextManager } from "@/lib/ordax/context-manager";

// Import refactored components and hooks
import {
  useChatState,
  useChatSend,
  useChatLogic,
  useStreamingGeneration,
  useScrollManagement,
} from "./chat/hooks";
import { useCompilerAutoAdvance } from "@/hooks/useCompilerAutoAdvance";

import { Header } from "./chat/components/Header";
import { DebugPanel } from "./chat/components/DebugPanel";
import { ChatMessages } from "./chat/components/ChatMessages";
import { ChatInput } from "./chat/components/ChatInput";

import { EXAMPLE_PROMPTS, WELCOME_MESSAGES } from "./studioChatPanelConstants";

interface Props {
  onSpec: (spec: OrdaxSpec, raw: string) => void;
  currentSpec?: OrdaxSpec;
  /** When set, enables code-first mutation mode against /vfs/games/<gameId>/ */
  gameId?: string;
}

interface ValidatedProps {
  onSpec: (spec: OrdaxSpec, raw: string) => void;
  currentSpec: OrdaxSpec | null;
  gameId: string | null;
}

const validateProps = (props: Props): { isValid: boolean; errors: string[]; validatedProps?: ValidatedProps } => {
  const errors: string[] = [];

  // Validar onSpec
  if (typeof props.onSpec !== 'function') {
    errors.push('onSpec deve ser uma função');
  }

  // Validar currentSpec
  if (props.currentSpec !== undefined && props.currentSpec !== null) {
    if (typeof props.currentSpec !== 'object' || Array.isArray(props.currentSpec)) {
      errors.push('currentSpec deve ser um objeto válido');
    } else if (!props.currentSpec.title || typeof props.currentSpec.title !== 'string') {
      errors.push('currentSpec.title deve ser uma string');
    }
  }

  // Validar gameId
  if (props.gameId !== undefined && props.gameId !== null) {
    if (typeof props.gameId !== 'string') {
      errors.push('gameId deve ser uma string');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(props.gameId)) {
      errors.push('gameId deve conter apenas letras, números, hífens e underscores');
    } else if (props.gameId.length > 100) {
      errors.push('gameId não pode exceder 100 caracteres');
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validatedProps: {
      onSpec: props.onSpec,
      currentSpec: props.currentSpec ?? null,
      gameId: props.gameId ?? null,
    },
  };
};

export function StudioChatPanel({ onSpec, currentSpec, gameId }: Props) {
  // 🔒 VALIDAÇÃO ROBUSTA DE PROPS
  const propsValidation = useMemo(() => validateProps({ onSpec, currentSpec, gameId }), [onSpec, currentSpec, gameId]);
  
  if (!propsValidation.isValid) {
    console.error("[StudioChatPanel] Props inválidos:", propsValidation.errors);
    
    return (
      <div className="flex h-full flex-col bg-card items-center justify-center p-8">
        <div className="text-destructive text-sm font-medium mb-2">
          Erro de configuração do StudioChatPanel
        </div>
        <div className="text-xs text-muted-foreground text-center mb-4">
          {propsValidation.errors.join(", ")}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
          aria-label="Recarregar página para corrigir erro"
        >
          Recarregar Página
        </Button>
      </div>
    );
  }
  
  // Props validados
  const validatedProps = propsValidation.validatedProps!;

  // Initialize hooks with validated data
  const chatState = useChatState({
    initialInput: "",
    initialMessages: [
      {
        role: "assistant" as const,
        content: WELCOME_MESSAGES.NEW_GAME.description || "Olá! Como posso ajudá-lo a criar seu jogo hoje?",
      },
    ],
    currentSpec: validatedProps.currentSpec,
    gameId: validatedProps.gameId,
  });

  const streamingGeneration = useStreamingGeneration({
    chatState,
    onSpec: validatedProps.onSpec,
    currentSpec: validatedProps.currentSpec,
    gameId: validatedProps.gameId,
  });

  // Compiler hooks (legacy - manter por compatibilidade)
  const autoAdvanceHook = useCompilerAutoAdvance({
    sessionId: chatState.sessionId || "",
    messages: [],
    userId: chatState.userIdRef.current,
    onPhaseChange: chatState.setCompilerPhase,
    onResponseReceived: chatState.addResponse,
    onConfirmationRequired: () => {
      chatState.setStage("awaiting_accept");
    },
  });

  const chatSend = useChatSend({
    chatState,
    streamingGeneration,
    autoAdvanceHook, // ✅ SSOT: Hook passado diretamente, sem wrapper adapter
    onSpec: validatedProps.onSpec,
    currentSpec: validatedProps.currentSpec,
    gameId: validatedProps.gameId,
  });

  const chatLogic = useChatLogic({
    chatState,
    chatSend,
    streamingGeneration,
    onSpec: validatedProps.onSpec,
    currentSpec: validatedProps.currentSpec,
    gameId: validatedProps.gameId,
  });

  const scrollManagement = useScrollManagement();

  // Update context when spec changes with error handling
  useEffect(() => {
    if (!validatedProps.currentSpec) return;
    
    let mounted = true;
    
    const updateContext = async () => {
      try {
        contextManager.updateSpec(validatedProps.currentSpec!);
        if (mounted) {
          console.log('[StudioChatPanel] Contexto atualizado com sucesso');
        }
      } catch (error) {
        if (mounted) {
          console.error('[StudioChatPanel] Falha ao atualizar contexto:', error);
          toast.error('Erro ao atualizar contexto do jogo');
        }
      }
    };
    
    updateContext();
    
    return () => {
      mounted = false;
    };
  }, [validatedProps.currentSpec]);

  // ✅ CORREÇÃO CRÍTICA: Usar funções estáveis individuais em vez de chatState (objeto instável)
  // O bug era: resetChatState dependia de [chatState] que muda a cada render,
  // causando useEffect infinito que limpava compilerResponses e messages.
  const resetChatState = useCallback(() => {
    chatState.resetCompilerState?.();
    chatState.setStreamingContent("");
    chatState.setCompilerPhase("interpretation");
    chatState.setSessionId(null);
    chatState.setPlanResult(null);
    chatState.setPendingNewGameMessages(null);
    chatState.setAcceptedPlan(null);
    chatState.setDebugRaw("");
    chatState.setDebugSanitized("");
    chatState.setDebugError("");
    chatState.setDebugFixes("");
    chatState.setPendingPatch(null);
    chatState.setPendingPatchOpen(false);
    
    // Show welcome message immediately
    chatState.setMessages([
      {
        role: "assistant" as const,
        content: "Workspace limpo! Descreva seu novo jogo ou use os exemplos abaixo.",
      },
    ]);
  }, [
    chatState.resetCompilerState,
    chatState.setMessages,
    chatState.setStreamingContent,
    chatState.setCompilerPhase,
    chatState.setSessionId,
    chatState.setPlanResult,
    chatState.setPendingNewGameMessages,
    chatState.setAcceptedPlan,
    chatState.setDebugRaw,
    chatState.setDebugSanitized,
    chatState.setDebugError,
    chatState.setDebugFixes,
    chatState.setPendingPatch,
    chatState.setPendingPatchOpen,
  ]);

  // ✅ CORREÇÃO: Só resetar quando currentSpec MUDA para null, não a cada render
  const prevCurrentSpecRef = useRef(validatedProps.currentSpec);
  useEffect(() => {
    const prev = prevCurrentSpecRef.current;
    prevCurrentSpecRef.current = validatedProps.currentSpec;
    // Só resetar se currentSpec MUDOU de algo para null (novo projeto)
    if (!validatedProps.currentSpec && prev !== null && prev !== undefined) {
      resetChatState();
    }
  }, [validatedProps.currentSpec, resetChatState]);

  // Update messages ref when messages change
  useEffect(() => {
    chatState.messagesRef.current = chatState.messages;
  }, [chatState.messages]);

  // Keep the chat scroll anchored with throttling
  useEffect(() => {
    if (!chatState.shouldStickToBottomRef.current) return;
    
    let animationFrameId: number;
    
    const scrollToBottom = () => {
      try {
        scrollManagement.scrollToBottom("smooth");
      } catch (error) {
        console.warn('[StudioChatPanel] Falha ao scrollar para baixo:', error);
      }
    };
    
    // Usar requestAnimationFrame para evitar jank
    animationFrameId = requestAnimationFrame(scrollToBottom);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
    // ✅ CORREÇÃO: Adicionado compilerResponses.length para scrollar quando respostas do compilador chegam
  }, [chatState.messages.length, chatState.compilerResponses.length, chatState.streamingContent, chatState.isStreaming, scrollManagement]);

  // Setup scroll listener
  useEffect(() => {
    const cleanup = scrollManagement.setupScrollListener();
    return cleanup;
  }, [scrollManagement.setupScrollListener]);

  // Retry last prompt function
  const retryLastPrompt = () => {
    const last = chatState.lastUserPromptRef.current.trim();
    if (!last) return toast.info("Nenhuma prompt anterior");
    void chatSend.send(last);
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Plan Review Drawer */}
      <PlanReviewDrawer
        open={chatState.planReviewOpen}
        onOpenChange={chatState.setPlanReviewOpen}
        data={chatState.planResult}
        onAccept={chatLogic.acceptPlanAndGenerate}
        accepting={chatState.acceptingPlan || chatState.isStreaming || chatState.isLoading}
      />

      {/* Code mutator patch preview */}
      <AlertDialog open={chatState.pendingPatchOpen} onOpenChange={chatState.setPendingPatchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar patch de código?</AlertDialogTitle>
            <AlertDialogDescription>
              O patch será aplicado no VFS e passará por um smoke test (import + extract). Se falhar, rollback automático.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Ops:</span> {chatState.pendingPatch?.ops.length ?? 0}
            </div>
            <div>
              <span className="font-medium">Dirs tocados:</span>{" "}
              {chatState.pendingPatchSummary?.touchedDirs?.length ? chatState.pendingPatchSummary.touchedDirs.join(", ") : "(nenhum)"}
            </div>
            {chatState.pendingPatchSummary?.warnings?.length ? (
              <div className="rounded-md border border-border/50 p-2">
                <div className="font-medium">Avisos</div>
                <ul className="list-disc pl-5">
                  {chatState.pendingPatchSummary.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={chatLogic.cancelPendingPatch}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={chatLogic.applyPendingPatch}>Aplicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <Header
        isEditMode={chatState.isEditMode}
        sessionId={chatState.sessionId}
        compilerPhase={chatState.compilerPhase as CompilerPhase}
        isLoading={chatState.isLoading}
        isStreaming={chatState.isStreaming}
        acceptingPlan={chatState.acceptingPlan}
        stage={chatState.stage}
        stageLabel={chatState.stageLabel}
      />

      {/* Debug Panel */}
      <DebugPanel
        showDebug={chatState.showDebug}
        debugRaw={chatState.debugRaw}
        debugSanitized={chatState.debugSanitized}
        debugFixes={chatState.debugFixes}
        debugError={chatState.debugError}
        debugSummary={chatState.debugSummary}
        setShowDebug={chatState.setShowDebug}
        retryLastPrompt={retryLastPrompt}
      />

      {/* Messages */}
      <ChatMessages
        messages={chatState.messages}
        compilerResponses={chatState.compilerResponses as CompilerResponse[]}
        isStreaming={chatState.isStreaming}
        streamingContent={chatState.streamingContent}
        isLoading={chatState.isLoading}
        loadingBubbleText={chatState.loadingBubbleText}
        isEditMode={chatState.isEditMode}
        examplePrompts={[...EXAMPLE_PROMPTS.NEW_GAME]}
        scrollAreaRef={scrollManagement.scrollAreaRef}
        setInput={chatState.setInput}
        handleApprove={chatLogic.handleApprove}
        approving={chatState.isLoading}
      />

      {/* Input */}
      <ChatInput
        input={chatState.input}
        isLoading={chatState.isLoading}
        isStreaming={chatState.isStreaming}
        placeholder={chatState.placeholder}
        disabled={chatState.isLoading || chatState.compilerPhase === "confirmation" || chatState.compilerPhase === "compilation"}
        setInput={chatState.setInput}
        send={chatSend.send}
        stopStreaming={chatLogic.stopStreaming}
        validateInput={chatState.validateInput}
      />

      {/* Debug Log Panel */}
      <DebugLogPanel />
    </div>
  );
}

