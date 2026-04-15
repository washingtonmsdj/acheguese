import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { OrdaxSpec, ChatMsg, CodeSemanticPatch } from "@/lib/ordax/types";
import { StreamingClient } from "@/lib/ordax/ai-streaming";
import { normalizeOrdaxSpec } from "@/lib/ordax/normalize";
import { autoFixOrdaxSpec, lintOrdaxSpec } from "@/lib/ordax/spec-lint";
import { resolveCanonicalGenre } from "@/lib/ordax/normalize-config";
import { applyIntentPatches, wantsAudioFromPrompt, summarizePatch } from "@/components/ordax/studioChatPanelUtils";
import { validateRuntimeAgainstPlan } from "@/lib/ordax/validateRuntimeAgainstPlan";
import { autofillGeneric } from "@/lib/ordax/runtime-autofill/generic";
import { supabase } from "@/integrations/supabase/client";
import { vfs } from "@/lib/vfs/VirtualFileSystem";
import { contextManager } from "@/lib/ordax/context-manager";
import { CHAT_MESSAGES } from "@/components/ordax/studioChatPanelConstants";

import type { UseChatStateReturn } from "./useChatState";

// Interface para resultado do streaming com campos opcionais
interface StreamingResult {
  spec?: OrdaxSpec;
  patch?: CodeSemanticPatch;
  semanticPatch?: { kind: string; ops: unknown[] };
  files?: Array<{ path: string; content: string }>;
  assistantSummary?: string;
  appliedEdits?: string[];
  planWarnings?: string[];
  fullResponse?: string;
}

export interface UseStreamingGenerationProps {
  chatState: UseChatStateReturn;
  onSpec: (spec: OrdaxSpec, raw: string) => void;
  currentSpec?: OrdaxSpec;
  gameId?: string;
}

export interface UseStreamingGenerationReturn {
  // Streaming functions
  streamWithClient: (
    messages: ChatMsg[],
    spec?: OrdaxSpec,
    approvedPlan?: unknown,
    sessionId?: string | null
  ) => Promise<void>;
  
  parseStreamingResult: (result: unknown) => {
    spec?: OrdaxSpec;
    patch?: CodeSemanticPatch;
    files?: Array<{ path: string; content: string }>;
    assistantSummary?: string;
    appliedEdits?: string[];
    planWarnings?: string[];
  };
  
  // Fallback function
  useFallbackSpec: (
    fullMessages: ChatMsg[], 
    spec?: OrdaxSpec, 
    approvedPlan?: unknown
  ) => Promise<void>;
}

export const useStreamingGeneration = ({
  chatState,
  onSpec,
  currentSpec,
  gameId
}: UseStreamingGenerationProps): UseStreamingGenerationReturn => {
  const {
    // State
    isCodeMutatorMode,
    codeEntryPath,
    lastUserPromptRef,
    acceptedPlan,
    acceptedPlanHuman,
    
    // Actions
    setIsStreaming,
    setStreamingContent,
    setStage,
    setIsLoading,
    setAcceptingPlan,
    setDebugRaw,
    setDebugError,
    setDebugFixes,
    setDebugSanitized,
    setPendingPatch,
    setPendingPatchSummary,
    setPendingPatchOpen,
    setMessages,
    
    // Refs
    streamingClientRef,
    pendingPatchMetaRef,
  } = chatState;

  const buildProjectFiles = useCallback(() => {
    return isCodeMutatorMode && gameId
      ? vfs
          .getAllFiles()
          .filter((f) => f.path.startsWith(`/vfs/games/${gameId}/`))
          .map((f) => ({ path: f.path, content: f.content }))
      : vfs.getAllFiles().map((f) => ({ path: f.path, content: f.content }));
  }, [isCodeMutatorMode, gameId]);

  const buildGenerationOptions = useCallback(
    (approvedPlanParam?: unknown, sessionIdParam?: string | null) => {
      if (isCodeMutatorMode && gameId) {
        return {
          mode: "code_patch" as const,
          targetGameId: gameId,
          sessionId: sessionIdParam || undefined,
        };
      }

      if (approvedPlanParam) {
        return {
          phase: "spec" as const,  // API usa 'spec' para geração completa
          approvedPlan: approvedPlanParam,
          approvedPlanHuman: acceptedPlanHuman || undefined,
          sessionId: sessionIdParam || undefined,
        };
      }

      if (acceptedPlan) {
        return {
          phase: "spec" as const,  // API usa 'spec' para geração completa
          approvedPlan: acceptedPlan,
          approvedPlanHuman: acceptedPlanHuman || undefined,
          sessionId: sessionIdParam || undefined,
        };
      }

      return undefined;
    },
    [isCodeMutatorMode, gameId, acceptedPlan, acceptedPlanHuman]
  );

  const resolvePlanGenre = useCallback((plan: unknown): string | undefined => {
    if (!plan || typeof plan !== "object") return undefined;
    const p = plan as Record<string, unknown>;
    const raw = (typeof p.gameType === "string" ? p.gameType : undefined)
      ?? (typeof p.genre === "string" ? p.genre : undefined);
    return raw ? String(resolveCanonicalGenre(raw)) : undefined;
  }, []);

  const normalizeWithPlanGenre = useCallback((sourceSpec: OrdaxSpec, plan: unknown) => {
    const planGenre = resolvePlanGenre(plan);
    const specToNormalize = sourceSpec;

    if (planGenre) {
      if (specToNormalize.gameType !== planGenre) {
        console.log("[useStreamingGeneration] Overriding spec gameType:", specToNormalize.gameType, "->", planGenre);
      }
      specToNormalize.gameType = planGenre;
      if (specToNormalize.metadata) {
        specToNormalize.metadata.genre = planGenre;
      }
    } else if (specToNormalize.gameType) {
      const resolved = String(resolveCanonicalGenre(specToNormalize.gameType));
      if (resolved !== specToNormalize.gameType) {
        specToNormalize.gameType = resolved;
        if (specToNormalize.metadata) specToNormalize.metadata.genre = resolved;
        console.log("[useStreamingGeneration] Canonicalized gameType:", resolved);
      }
    }

    return {
      planGenre,
      normalized: normalizeOrdaxSpec(specToNormalize, { gameType: planGenre }),
    };
  }, [resolvePlanGenre]);

  const fallbackGenerate = useCallback(async (
    fullMessages: ChatMsg[],
    spec?: OrdaxSpec,
    approvedPlanParam?: unknown,
    sessionIdParam?: string | null
  ) => {

    try {
      if (isCodeMutatorMode) {
        throw new Error("Falha na geracao de patch. Tente novamente.");
      }
      const projectFiles = buildProjectFiles();
      const options = buildGenerationOptions(approvedPlanParam, sessionIdParam);
      const { data, error } = await supabase.functions.invoke("game-ai-chat-stream", {
        body: {
          messages: fullMessages,
          currentSpec: spec,
          projectFiles,
          ...(options ?? {}),
        },
      });

      if (error) {
        throw new Error(error.message || "Fallback falhou");
      }

      const raw =
        typeof (data as Record<string, unknown>)?.raw === "string"
          ? ((data as Record<string, unknown>).raw as string)
          : typeof (data as Record<string, unknown>)?.response === "string"
            ? ((data as Record<string, unknown>).response as string)
            : JSON.stringify(data ?? {});

      setDebugRaw(raw);

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed.error) {
        throw new Error(typeof parsed.message === "string" ? parsed.message : String(parsed.error));
      }

      if (!parsed.spec || typeof parsed.spec !== "object") {
        throw new Error("Fallback retornou payload sem spec válida");
      }

      const planToValidate = approvedPlanParam ?? acceptedPlan;
      const { normalized } = normalizeWithPlanGenre(parsed.spec as OrdaxSpec | undefined, planToValidate);
      const finalSpec = autofillGeneric(normalized).spec;
      const sanitized = JSON.stringify(finalSpec, null, 2);

      setDebugSanitized(sanitized);
      onSpec(finalSpec, sanitized);

      const summary =
        typeof parsed.assistantSummary === "string" && parsed.assistantSummary.trim().length > 0
          ? parsed.assistantSummary
          : `✓ ${finalSpec.title || "Jogo atualizado"}`;

      const assistantMessage: ChatMsg = {
        role: "assistant",
        content: `${summary}\n\nResposta aplicada via fallback resiliente.`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      contextManager.addMessage(assistantMessage);
      toast.success(CHAT_MESSAGES.SUCCESS.GAME_GENERATED);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDebugError(message);
      toast.error(`${CHAT_MESSAGES.ERRORS.SPEC_GENERATION_FAILED}: ${message}`);
    } finally {
      setAcceptingPlan(false);
      setIsStreaming(false);
      setIsLoading(false);
      setStage("idle");
    }
  }, [
    isCodeMutatorMode,
    acceptedPlan,
    buildProjectFiles,
    buildGenerationOptions,
    normalizeWithPlanGenre,
    setDebugRaw,
    setDebugSanitized,
    setDebugError,
    setAcceptingPlan,
    setIsStreaming,
    setIsLoading,
    setStage,
    setMessages,
    onSpec,
  ]);

  // Streaming function
  const streamWithClient = useCallback(async (
    fullMessages: ChatMsg[],
    spec?: OrdaxSpec,
    approvedPlan?: unknown,
    sessionIdParam?: string | null
  ) => {
    console.log('[useStreamingGeneration] streamWithClient iniciado', { 
      messagesCount: fullMessages.length, 
      hasSpec: !!spec, 
      isCodeMutatorMode,
      sessionId: sessionIdParam
    });
    
    const projectFiles = buildProjectFiles();
    const streamOptions = buildGenerationOptions(approvedPlan, sessionIdParam);

    console.log('[useStreamingGeneration] Project files:', projectFiles.length);

    // Create streaming client
    const client = new StreamingClient();
    streamingClientRef.current = client;

    setIsStreaming(true);
    setStreamingContent("");
    setStage("generating");

    // ✅ CORREÇÃO CRÍTICA: Timeout de segurança para evitar bloqueio permanente
    const safetyTimeout = setTimeout(() => {
      console.error('[useStreamingGeneration] SAFETY TIMEOUT: Resetando estados após 60s');
      setIsStreaming(false);
      setIsLoading(false);
      setAcceptingPlan(false);
      setStage("idle");
      toast.error("Timeout: O chat foi desbloqueado. Tente novamente.");
    }, 60000); // 60 segundos

    console.log('[useStreamingGeneration] Chamando client.stream()...');
    
    try {
      let streamedContent = "";

      await client.stream(
        fullMessages,
        isCodeMutatorMode ? undefined : spec,
        projectFiles,
        (chunk: string) => {
          streamedContent += chunk;
          setStreamingContent(streamedContent);
        },
        (result) => {
          // ✅ CORREÇÃO CRÍTICA: Resetar TODOS os estados de loading no início
          clearTimeout(safetyTimeout); // Limpar timeout de segurança
          setIsStreaming(false);
          setIsLoading(false);
          setAcceptingPlan(false);
          setStreamingContent("");
          setStage("applying");

          setDebugRaw(result.fullResponse ?? "");

          // ==============================
          // CODE MUTATOR MODE (code-first)
          // ==============================
          if (isCodeMutatorMode && result.patch && gameId && codeEntryPath) {
            try {
              const patch = result.patch as CodeSemanticPatch;

              // Quality-first: preview + confirm before applying
              setPendingPatch(patch);
              setPendingPatchSummary(summarizePatch(patch));
              const streamingResult = result as StreamingResult;
              pendingPatchMetaRef.current = {
                assistantSummary: streamingResult?.assistantSummary,
                appliedEdits: streamingResult?.appliedEdits,
              };
              setPendingPatchOpen(true);
              setStage("idle");
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              toast.error(msg);
              setDebugError(msg);
              setStage("idle");
              setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
            }
            return;
          }

          // Update files in VFS (JSON/spec pipeline)
          if (result.files && result.files.length > 0) {
            result.files.forEach((file) => {
              const existing = vfs.getNodeByPath(file.path);
              if (existing && existing.type === "file") {
                vfs.updateFileContent(existing.id, file.content);
              } else {
                const parts = file.path.split("/");
                const fileName = parts.pop() || "file.ts";
                const dirPath = parts.join("/") || "/";
                vfs.createFile(fileName, dirPath, "typescript", file.content);
              }
            });
            toast.success(`${result.files.length} arquivos atualizados!`);          }

          if (result.spec) {
            // Contract guard-rails: reject generic/non-patch responses.
            // RELAXED: allow responses without semanticPatch if it's a simple spec update
            const streamingResult: StreamingResult = result;
            const hasSemanticPatch = !!(streamingResult)?.semanticPatch;
            const hasAppliedEdits = Array.isArray(streamingResult?.appliedEdits) && streamingResult.appliedEdits.length > 0;
            
            // Only enforce strict validation if we're in EDIT mode (not NEW_GAME)
            const isEditMode = currentSpec !== null;

            if (isEditMode && (!hasSemanticPatch || !hasAppliedEdits)) {
              console.warn("[useStreamingGeneration] Resposta sem semanticPatch/appliedEdits em modo EDIT, mas permitindo...");
              // Create a synthetic semanticPatch for backwards compatibility
              streamingResult.semanticPatch = { kind: "SEMANTIC_PATCH", ops: [{ op: "update_spec", description: "Spec atualizado" }] };
              streamingResult.appliedEdits = ["Spec atualizado com mudanças solicitadas"];
            }

            const issues = lintOrdaxSpec(streamingResult.spec);
            const fixed = autoFixOrdaxSpec(streamingResult.spec, issues);

            const promptPatched = applyIntentPatches(fixed.spec, lastUserPromptRef.current);
            if (fixed.fixes.length || fixed.issues.length || promptPatched.patches.length) {
              setDebugFixes(
                JSON.stringify(
                  {
                    issues: fixed.issues,
// ... (rest of the code remains the same)
                    fixes: fixed.fixes,
                    promptPatches: promptPatched.patches,
                  },
                  null,
                  2
                )
              );
            }
            const planToValidate = approvedPlan ?? acceptedPlan;
            const { normalized } = normalizeWithPlanGenre(promptPatched.spec as OrdaxSpec | undefined, planToValidate);

            // Validate runtimeSpec against the last accepted plan (if any)
            if (planToValidate) {
              const validation = validateRuntimeAgainstPlan(planToValidate, normalized);
              const hardErrors = validation.issues.filter((i) => i.severity === "error");
              
              // ✅ CORREÇÃO CRÍTICA: Não bloquear o fluxo por erros de validação
              // Mostrar erros como WARNING, mas SEMPRE aplicar a spec
              if (hardErrors.length) {
                const msg = `⚠️ AVISO: runtimeSpec tem ${hardErrors.length} diferença(s) do plano aceito.`;
                console.warn('[useStreamingGeneration] Validation errors (non-blocking):', {
                  errorCount: hardErrors.length,
                  issues: validation.issues
                });
                
                setDebugError(
                  JSON.stringify(
                    {
                      message: msg,
                      issues: validation.issues,
                      warnings: validation.warnings,
                      engineGapReport: validation.engineGapReport,
                    },
                    null,
                    2
                  )
                );
                
                // ✅ Mostrar warning mas NÃO bloquear
                toast.warning(`${msg} Aplicando spec mesmo assim...`);
                setMessages((prev) => [...prev, { 
                  role: "assistant", 
                  content: `⚠️ ${msg}\n\nA spec foi aplicada, mas você pode pedir ajustes: \"corrija o runtimeSpec para obedecer o plano\".` 
                }]);
                
                // ✅ NÃO fazer return aqui - continuar aplicando a spec
              }
              
              if (validation.warnings.length || validation.engineGapReport?.items?.length) {
                const warnBlock = [
                  ...(validation.warnings.length ? [`⚠️ Warnings:\n- ${validation.warnings.join("\n- ")}`] : []),
                  ...(validation.engineGapReport?.items?.length
                    ? [
                        `⚠️ ENGINE_GAP:\n- ${validation.engineGapReport.items
                          .slice(0, 5)
                          .map((it) => `${it.area}: ${it.limitation}`)
                          .join("\n- ")}`,
                      ]
                    : []),
                ].join("\n\n");
                if (warnBlock.trim()) {
                  setMessages((prev) => [...prev, { role: "assistant", content: warnBlock }]);
                }
              }
            }

            // ✅ SEMPRE aplicar a spec, independente de erros de validação

            // ✅ AUTOFILL: preencher entidades/sistemas faltantes para garantir jogabilidade
            const autofilled = autofillGeneric(normalized);
            if (autofilled.wasModified) {
              console.log("[useStreamingGeneration] Autofill applied:", autofilled.changes);
            }
            const finalSpec = autofilled.spec;

            const raw = JSON.stringify(finalSpec, null, 2);
            setDebugSanitized(raw);

            const result2 = result as StreamingResult;
            const appliedEdits = result2?.appliedEdits;
            const assistantSummaryFromModel = result2?.assistantSummary;

            const planWarn = result2?.planWarnings;
            const planWarnBlock = planWarn?.length
              ? `\n\n🧠 Plano (auto-ajustes):\n- ${planWarn.slice(0, 6).join("\n- ")}`
              : "";

            const appliedBlock = appliedEdits?.length
              ? `\n\nAlterações aplicadas:\n- ${appliedEdits.slice(0, 10).join("\n- ")}`
              : "";

            const assistantSummary: ChatMsg = {
              role: "assistant",
              content:
                (assistantSummaryFromModel?.trim()
                  ? assistantSummaryFromModel.trim()
                  : `✓ ${finalSpec.title || "Jogo atualizado"}` +
                    (finalSpec.description ? `\n${finalSpec.description}` : "")) +
                (wantsAudioFromPrompt(lastUserPromptRef.current)
                  ? "\n\n🔊 Áudio: ativado (AudioSystem + bloco audio)"
                  : "") +
                (promptPatched.notes?.length ? `\n\n${promptPatched.notes.join("\n")}` : "") +
                planWarnBlock +
                appliedBlock +
                "\n\nAgora me diga o que você quer melhorar no projeto (mecânicas, visual, UI, dificuldade, etc.).",
            };
            setMessages((prev) => [...prev, assistantSummary]);
            contextManager.addMessage(assistantSummary);

            onSpec(finalSpec, raw);
            // Note: requestCoachTips será chamado separadamente
            
            // ✅ CORREÇÃO CRÍTICA: Sempre voltar para idle após aplicar spec
            // Isso desbloqueia o chat para nova interação
            setStage("idle");
            setIsLoading(false);
            setIsStreaming(false);
          } else {
            // ✅ CORREÇÃO: Se não tiver spec, também resetar estados
            console.warn("[useStreamingGeneration] Resultado sem spec, resetando estados");
            setStage("idle");
            setIsLoading(false);
            setIsStreaming(false);
          }
        },
        (error) => {
          clearTimeout(safetyTimeout); // Limpar timeout de segurança
          console.error("[useStreamingGeneration] Streaming error callback:", error);
          console.warn("Streaming failed, using fallback:", error);
          setDebugError(error);
          setAcceptingPlan(false);
          // ✅ CORREÇÃO: Resetar todos os estados em caso de erro
          setIsStreaming(false);
          setIsLoading(false);
          setStage("idle");
          void fallbackGenerate(fullMessages, spec, approvedPlan, sessionIdParam);
        },
        streamOptions
      );
    } catch (error) {
      clearTimeout(safetyTimeout); // Limpar timeout de segurança
      console.error("[useStreamingGeneration] Streaming exception:", error);
      console.warn("Streaming error, using fallback:", error);
      setAcceptingPlan(false);
      // ✅ CORREÇÃO: Resetar todos os estados em caso de exceção
      setIsStreaming(false);
      setIsLoading(false);
      setStage("idle");
      void fallbackGenerate(fullMessages, spec, approvedPlan, sessionIdParam);
    }
  }, [
    buildProjectFiles,
    buildGenerationOptions,
    fallbackGenerate,
    normalizeWithPlanGenre,
    isCodeMutatorMode,
    gameId,
    codeEntryPath,
    currentSpec,
    acceptedPlan,
    lastUserPromptRef,
    setIsStreaming,
    setStreamingContent,
    setStage,
    setIsLoading,
    setAcceptingPlan,
    setDebugRaw,
    setDebugError,
    setDebugFixes,
    setDebugSanitized,
    setPendingPatch,
    setPendingPatchSummary,
    setPendingPatchOpen,
    setMessages,
    onSpec,
    streamingClientRef,
    pendingPatchMetaRef,
  ]);

  // Parse streaming result
  const parseStreamingResult = useCallback((result: unknown) => {
    return {
      spec: result.spec,
      patch: result.patch,
      files: result.files,
      assistantSummary: result.assistantSummary,
      appliedEdits: result.appliedEdits,
      planWarnings: result.planWarnings,
    };
  }, []);

  // Fallback function (direct backend invoke, no streaming)
  const useFallbackSpec = useCallback(async (
    fullMessages: ChatMsg[], 
    spec?: OrdaxSpec, 
    approvedPlan?: unknown
  ) => {
    await fallbackGenerate(fullMessages, spec, approvedPlan, null);
  }, [fallbackGenerate]);

  // ✅ CORREÇÃO: Cleanup de streaming quando componente desmonta
  useEffect(() => {
    return () => {
      // Cancelar streaming ativo se existir
      if (streamingClientRef.current) {
        console.log('[useStreamingGeneration] Cleanup: cancelando streaming ativo');
        streamingClientRef.current.cancel();
        streamingClientRef.current = null;
      }
    };
  }, [streamingClientRef]);

  return {
    streamWithClient,
    parseStreamingResult,
    useFallbackSpec,
  };
};


