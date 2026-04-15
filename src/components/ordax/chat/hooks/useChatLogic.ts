import { useCallback } from "react";
import { toast } from "sonner";
import type { OrdaxSpec } from "@/lib/ordax/types";
import type { ChatMsg } from "@/lib/ordax/ai-streaming";
import { normalizeOrdaxSpec } from "@/lib/ordax/normalize";
import { autoFixOrdaxSpec, lintOrdaxSpec } from "@/lib/ordax/spec-lint";
import { applyIntentPatches } from "@/components/ordax/studioChatPanelUtils";
import { validateGenreContract } from "@/lib/ordax/genreContracts";
import { validateRuntimeAgainstPlan } from "@/lib/ordax/validateRuntimeAgainstPlan";
import { buildHumanGamePlanText } from "@/lib/ordax/human-game-plan";
import { supabase } from "@/integrations/supabase/client";
import { vfs } from "@/lib/vfs/VirtualFileSystem";
import { applyCodeSemanticPatch, loadCodeGameFromVfs, type CodeSemanticPatch } from "@/lib/ordax/code-mutator";
import { extractRuntimeSpecFromGameCode } from "@/games/_template";
import { contextManager } from "@/lib/ordax/context-manager";
import { CHAT_MESSAGES } from "@/components/ordax/studioChatPanelConstants";

import type { UseChatStateReturn } from "./useChatState";
import type { UseChatSendReturn } from "./useChatSend";
import type { UseStreamingGenerationReturn } from "./useStreamingGeneration";

export interface UseChatLogicProps {
  chatState: UseChatStateReturn;
  chatSend: UseChatSendReturn;
  streamingGeneration: UseStreamingGenerationReturn;
  onSpec: (spec: OrdaxSpec, raw: string) => void;
  currentSpec?: OrdaxSpec;
  gameId?: string;
}

export interface UseChatLogicReturn {
  // Plan approval
  handleApprove: () => Promise<void>;
  
  // Patch application
  applyPendingPatch: () => Promise<void>;
  cancelPendingPatch: () => void;
  
  // Plan acceptance
  acceptPlanAndGenerate: () => Promise<void>;
  
  // Streaming control
  stopStreaming: () => void;
  
  // Validation helpers
  validatePlan: (plan: unknown) => { valid: boolean; violation?: string };
  validateSpec: (spec: OrdaxSpec) => { valid: boolean; issues: string[] };
  
  // Utility functions
  formatAssistantMessage: (content: string, appliedEdits?: string[]) => ChatMsg;
  logStructuredError: (error: unknown, context: string) => void;
}

export const useChatLogic = ({
  chatState,
  chatSend,
  streamingGeneration,
  onSpec,
  currentSpec,
  gameId
}: UseChatLogicProps): UseChatLogicReturn => {
  const {
    // State
    compilerResponses,
    sessionId,
    messagesRef,
    userIdRef,
    setIsLoading,
    setStage,
    setDebugError,
    setDebugRaw,
    setDebugSanitized,
    setDebugFixes,
    setPendingPatch,
    setPendingPatchOpen,
    setPendingPatchSummary,
    pendingPatchMetaRef,
    setMessages,
    setPlanResult,
    setPendingNewGameMessages,
    setPlanReviewOpen,
    setAcceptedPlan,
    setAcceptingPlan,
    isEditMode,
    codeEntryPath,
    
    // Actions
    addResponse,
    setCompilerPhase,
    setSessionId,
    resetCompilerState,
  } = chatState;

  const {
    send,
    generateSpecStreaming,
    useFallbackSpec,
  } = chatSend;

  const {
    // Streaming functions if needed
  } = streamingGeneration;

  // Plan approval logic
  const handleApprove = useCallback(async () => {
    const lastResponse = compilerResponses[compilerResponses.length - 1];
    if (!lastResponse || lastResponse.kind !== "CONFIRMATION_REQUIRED") return;

    const plan = (lastResponse as Record<string, unknown>)?.plan;
    if (!plan) {
      toast.error(CHAT_MESSAGES.ERRORS.NO_PLAN_TO_APPROVE);
      return;
    }

    // Genre contract validation: warn but don't block
    const contractValidation = validateGenreContract(plan);
    if (!contractValidation.valid && contractValidation.violation) {
      console.warn('[useChatLogic] Genre contract warning (non-blocking):', contractValidation.violation);
      // Auto-fix: add missing systems/entities to satisfy the contract
      const missing = contractValidation.violation.missing || [];
      if (!plan.requiredSystems) plan.requiredSystems = [];
      if (!plan.requiredEntities) plan.requiredEntities = [];
      for (const item of missing) {
        if (item.includes("System") && !plan.requiredSystems.includes(item)) {
          plan.requiredSystems.push(item);
        } else if (!item.includes("System") && !item.includes("(")) {
          // It's an entity name like "player"
          const entityExists = plan.requiredEntities.some((e: string) => 
            e === item || e.startsWith(item) || e.includes(item)
          );
          if (!entityExists) plan.requiredEntities.push(item);
        }
      }
      // Ensure "player" entity exists (AI may use "player_car" etc.)
      const hasPlayer = plan.requiredEntities.some((e: string) => 
        e === "player" || e.includes("player")
      );
      if (!hasPlayer) plan.requiredEntities.push("player");
    }

    const approvalSessionId = (lastResponse as Record<string, unknown>)?.sessionId as string ?? sessionId;
    const approvalMessages = messagesRef.current;

    setIsLoading(true);
    setStage("generating");

    try {
      // Go directly to spec generation with the approved plan
      // No need to call game-ai-chat with APPROVE_PLAN since we already have the plan
      console.log('[useChatLogic] 🔍 DEBUG: Generating spec from approved plan', {
        approvalSessionId,
        messagesCount: approvalMessages.length,
      });

      await generateSpecStreaming(approvalMessages, undefined, plan, approvalSessionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Erro: ${msg}`);
      setIsLoading(false);
    }
  }, [compilerResponses, sessionId, messagesRef, userIdRef, setIsLoading, setStage, generateSpecStreaming]);

  // Patch application logic
  const applyPendingPatch = useCallback(async () => {
    const pendingPatch = chatState.pendingPatch;
    if (!pendingPatch || !gameId || !codeEntryPath) return;

    setPendingPatchOpen(false);
    setStage("applying");

    // Snapshot VFS for rollback safety
    const snapshot = vfs.export();
    try {
      const applyResult = applyCodeSemanticPatch(vfs as unknown as VFS, pendingPatch);
      if (!applyResult.ok) {
        const msg = `${CHAT_MESSAGES.ERRORS.PATCH_REJECTED} ${("errors" in applyResult ? applyResult.errors : []).join("; ")}`;
        vfs.import(snapshot);
        toast.error(msg);
        setDebugError(msg);
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
        setStage("idle");
        return;
      }

      // Import/extract smoke test; rollback if it fails
      const game = await loadCodeGameFromVfs(vfs as unknown as VFS, codeEntryPath);
      const nextSpec = extractRuntimeSpecFromGameCode(game);
      const raw = JSON.stringify(nextSpec, null, 2);
      setDebugSanitized(raw);
      onSpec(nextSpec, raw);

      toast.success(`${CHAT_MESSAGES.SUCCESS.PATCH_APPLIED} (${applyResult.appliedOps.length} ops)`);

      const meta = pendingPatchMetaRef.current;
      const assistantSummaryFromModel = meta?.assistantSummary;
      const appliedEdits = meta?.appliedEdits;
      const assistantSummary: ChatMsg = {
        role: "assistant",
        content:
          (assistantSummaryFromModel?.trim() ? assistantSummaryFromModel.trim() : "✓ Patch aplicado no código") +
          (appliedEdits?.length ? `\n\nAlterações aplicadas:\n- ${appliedEdits.slice(0, 10).join("\n- ")}` : "") +
          "\n\nPeça o próximo ajuste no código (sempre via patches).",
      };
      setMessages((prev) => [...prev, assistantSummary]);
      contextManager.addMessage(assistantSummary);
    } catch (e) {
      vfs.import(snapshot);
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`${CHAT_MESSAGES.ERRORS.PATCH_ROLLBACK} ${msg}`);
      setDebugError(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Patch revertido automaticamente (quebrou import/extract).\n\nDetalhes: ${msg}` },
      ]);
    } finally {
      setPendingPatch(null);
      setPendingPatchSummary(null);
      pendingPatchMetaRef.current = null;
      setStage("idle");
    }
  }, [
    chatState.pendingPatch,
    gameId,
    codeEntryPath,
    setPendingPatchOpen,
    setStage,
    setDebugError,
    setMessages,
    setDebugSanitized,
    onSpec,
    setPendingPatch,
    setPendingPatchSummary,
    pendingPatchMetaRef,
  ]);

  const cancelPendingPatch = useCallback(() => {
    setPendingPatchOpen(false);
    setPendingPatch(null);
    setPendingPatchSummary(null);
    pendingPatchMetaRef.current = null;
    toast(CHAT_MESSAGES.INFO.PATCH_CANCELLED, { duration: 2000 });
  }, [setPendingPatchOpen, setPendingPatch, setPendingPatchSummary, pendingPatchMetaRef]);

  // Plan acceptance logic
  const acceptPlanAndGenerate = useCallback(async () => {
    if (!chatState.planResult?.plan || !chatState.pendingNewGameMessages) return;
    
    setAcceptedPlan(chatState.planResult.plan);
    setAcceptingPlan(true);
    setIsLoading(true);
    setStage("generating");
    
    // Feche imediatamente para evitar a sensação de travamento; o progresso aparece no chat.
    setPlanReviewOpen(false);

    try {
      await generateSpecStreaming(
        chatState.pendingNewGameMessages, 
        undefined, 
        chatState.planResult.plan, 
        sessionId
      );
    } finally {
      // Safety net: se streaming/fallback falhar antes do onComplete, não deixe a UI travada.
      setAcceptingPlan(false);
    }
  }, [
    chatState.planResult,
    chatState.pendingNewGameMessages,
    sessionId,
    setAcceptedPlan,
    setAcceptingPlan,
    setIsLoading,
    setStage,
    setPlanReviewOpen,
    generateSpecStreaming,
  ]);

  // Streaming control
  const stopStreaming = useCallback(() => {
    if (chatState.streamingClientRef.current) {
      chatState.streamingClientRef.current.cancel();
      setIsLoading(false);
      chatState.setStreamingContent("");
      setStage("idle");
    }
  }, [chatState.streamingClientRef, chatState.setStreamingContent, setIsLoading, setStage]);

  // Validation helpers
  const validatePlan = useCallback((plan: unknown) => {
    return validateGenreContract(plan);
  }, []);

  const validateSpec = useCallback((spec: OrdaxSpec) => {
    const issues = lintOrdaxSpec(spec);
    return { valid: issues.length === 0, issues };
  }, []);

  // Utility functions
  const formatAssistantMessage = useCallback((content: string, appliedEdits?: string[]): ChatMsg => {
    const baseContent = content.trim();
    const editsBlock = appliedEdits?.length 
      ? `\n\nAlterações aplicadas:\n- ${appliedEdits.slice(0, 10).join("\n- ")}`
      : "";
    
    return {
      role: "assistant",
      content: baseContent + editsBlock,
    };
  }, []);

  const logStructuredError = useCallback((error: unknown, context: string) => {
    console.error(`[StudioChatPanel] ${context}:`, error);
    setDebugError(JSON.stringify({
      context,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    }, null, 2));
  }, [setDebugError]);

  return {
    handleApprove,
    applyPendingPatch,
    cancelPendingPatch,
    acceptPlanAndGenerate,
    stopStreaming,
    validatePlan,
    validateSpec,
    formatAssistantMessage,
    logStructuredError,
  };
};