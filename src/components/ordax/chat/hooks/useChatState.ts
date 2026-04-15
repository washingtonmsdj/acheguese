import { useState, useRef, useCallback, useMemo } from "react";
import type { OrdaxSpec, ChatMsg, CompilerResponse, CompilerPhase, CodeSemanticPatch, GamePlanResult } from "@/lib/ordax/types";
import { StreamingClient } from "@/lib/ordax/ai-streaming";
import { STAGE_LABELS, PLACEHOLDERS } from "@/components/ordax/studioChatPanelConstants";

export interface ChatState {
  // Input state
  input: string;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  
  // Messages state
  messages: ChatMsg[];
  messagesRef: React.MutableRefObject<ChatMsg[]>;
  
  // Compiler state
  compilerPhase: CompilerPhase;
  sessionId: string | null;
  compilerResponses: CompilerResponse[];
  stage: ChatStage;
  
  // Debug state
  debugRaw: string;
  debugSanitized: string;
  debugError: string;
  debugFixes: string;
  showDebug: boolean;
  
  // Patch state
  pendingPatch: CodeSemanticPatch | null;
  pendingPatchOpen: boolean;
  pendingPatchSummary: { touchedDirs?: string[]; warnings?: string[] } | null;
  pendingPatchMeta: { assistantSummary?: string; appliedEdits?: string[] } | null;
  
  // Plan state
  planResult: GamePlanResult | null;
  planReviewOpen: boolean;
  pendingNewGameMessages: ChatMsg[] | null;
  acceptedPlan: unknown | null;
  acceptingPlan: boolean;
  
  // Refs
  streamingClientRef: React.MutableRefObject<StreamingClient | null>;
  lastUserPromptRef: React.MutableRefObject<string>;
  pendingPatchMetaRef: React.MutableRefObject<{ assistantSummary?: string; appliedEdits?: string[] } | null>;
  shouldStickToBottomRef: React.MutableRefObject<boolean>;
  userIdRef: React.MutableRefObject<string>;
}

export type ChatStage = "idle" | "planning" | "awaiting_accept" | "generating" | "applying" | "coaching";

export interface UseChatStateProps {
  initialInput?: string;
  initialMessages?: ChatMsg[];
  currentSpec?: OrdaxSpec;
  gameId?: string;
}

export interface UseChatStateReturn extends ChatState {
  // Plan human text
  acceptedPlanHuman: string;
  // Input actions
  setInput: (input: string) => void;
  validateInput: () => boolean;
  clearInput: () => void;
  trimInput: () => void;
  
  // Loading actions
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  
  // Messages actions
  setMessages: (messages: ChatMsg[] | ((prev: ChatMsg[]) => ChatMsg[])) => void;
  addMessage: (message: ChatMsg) => void;
  clearMessages: () => void;
  validateMessages: () => boolean;
  
  // Compiler actions
  setCompilerPhase: (phase: CompilerPhase) => void;
  setSessionId: (sessionId: string | null) => void;
  setStage: (stage: ChatStage) => void;
  addResponse: (response: CompilerResponse) => void;
  resetCompilerState: () => void;
  
  // Debug actions
  setDebugRaw: (raw: string) => void;
  setDebugSanitized: (sanitized: string) => void;
  setDebugError: (error: string) => void;
  setDebugFixes: (fixes: string) => void;
  setShowDebug: (show: boolean) => void;
  resetDebug: () => void;
  validateDebugState: () => boolean;
  
  // Patch actions
  setPendingPatch: (patch: CodeSemanticPatch | null) => void;
  setPendingPatchOpen: (open: boolean) => void;
  setPendingPatchSummary: (summary: { touchedDirs?: string[]; warnings?: string[] } | null) => void;
  setPendingPatchMeta: (meta: { assistantSummary?: string; appliedEdits?: string[] } | null) => void;
  resetPatchState: () => void;
  validatePatchState: () => boolean;
  
  // Plan actions
  setPlanResult: (result: GamePlanResult | null) => void;
  setPlanReviewOpen: (open: boolean) => void;
  setPendingNewGameMessages: (messages: ChatMsg[] | null) => void;
  setAcceptedPlan: (plan: unknown | null) => void;
  setAcceptingPlan: (accepting: boolean) => void;
  resetPlanState: () => void;
  validatePlanState: () => boolean;
  
  // Derived state
  isEditMode: boolean;
  codeEntryPath: string | undefined;
  isCodeMutatorMode: boolean;
  placeholder: string;
  stageLabel: string;
  loadingBubbleText: string;
  debugSummary: { entities: number; systems: number; gameType: string } | null;
}

export const useChatState = ({
  initialInput = "",
  initialMessages = [],
  currentSpec,
  gameId
}: UseChatStateProps): UseChatStateReturn => {
  // Input state
  const [input, setInput] = useState(initialInput);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  
  // Messages state
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const messagesRef = useRef<ChatMsg[]>(initialMessages);
  
  // Compiler state
  const [compilerPhase, setCompilerPhase] = useState<CompilerPhase>("interpretation");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [compilerResponses, setCompilerResponses] = useState<CompilerResponse[]>([]);
  const [stage, setStage] = useState<ChatStage>("idle");
  
  // Debug state
  const [debugRaw, setDebugRaw] = useState("");
  const [debugSanitized, setDebugSanitized] = useState("");
  const [debugError, setDebugError] = useState("");
  const [debugFixes, setDebugFixes] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  
  // Patch state
  const [pendingPatch, setPendingPatch] = useState<CodeSemanticPatch | null>(null);
  const [pendingPatchOpen, setPendingPatchOpen] = useState(false);
  const [pendingPatchSummary, setPendingPatchSummary] = useState<{ touchedDirs?: string[]; warnings?: string[] } | null>(null);
  const [pendingPatchMeta, setPendingPatchMeta] = useState<{ assistantSummary?: string; appliedEdits?: string[] } | null>(null);
  
  // Plan state
  const [planResult, setPlanResult] = useState<GamePlanResult | null>(null);
  const [planReviewOpen, setPlanReviewOpen] = useState(false);
  const [pendingNewGameMessages, setPendingNewGameMessages] = useState<ChatMsg[] | null>(null);
  const [acceptedPlan, setAcceptedPlan] = useState<unknown | null>(null);
  const [acceptingPlan, setAcceptingPlan] = useState(false);
  
  // Refs
  const streamingClientRef = useRef<StreamingClient | null>(null);
  const lastUserPromptRef = useRef<string>("");
  const pendingPatchMetaRef = useRef<{ assistantSummary?: string; appliedEdits?: string[] } | null>(null);
  const shouldStickToBottomRef = useRef<boolean>(true);
  
  // Stable id to keep the compiler protocol session consistent across requests.
  // 🔒 REFATORAÇÃO: Fallback seguro para crypto.randomUUID()
  const generateUserId = (): string => {
    try {
      return `user_${crypto.randomUUID()}`;
    } catch (error) {
      console.warn("[useChatState] crypto.randomUUID() não disponível, usando fallback");
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };
  
  const userIdRef = useRef<string>(generateUserId());
  
  // Update messages ref when messages change
  const handleSetMessages = useCallback((newMessages: ChatMsg[] | ((prev: ChatMsg[]) => ChatMsg[])) => {
    if (typeof newMessages === "function") {
      setMessages(prev => {
        const result = newMessages(prev);
        messagesRef.current = result;
        return result;
      });
    } else {
      setMessages(newMessages);
      messagesRef.current = newMessages;
    }
  }, []);
  
  const addMessage = useCallback((message: ChatMsg) => {
    handleSetMessages(prev => [...prev, message]);
  }, [handleSetMessages]);
  
  const clearMessages = useCallback(() => {
    handleSetMessages([]);
  }, [handleSetMessages]);
  
  // Compiler actions
  const addResponse = useCallback((response: CompilerResponse) => {
    setCompilerResponses(prev => [...prev, response]);
  }, []);
  
  const resetCompilerState = useCallback(() => {
    setCompilerPhase("interpretation");
    setSessionId(null);
    setCompilerResponses([]);
    setStage("idle");
  }, []);
  
  // Debug actions
  const resetDebug = useCallback(() => {
    setDebugRaw("");
    setDebugSanitized("");
    setDebugError("");
    setDebugFixes("");
    setShowDebug(false);
  }, []);
  
  // Patch actions
  const resetPatchState = useCallback(() => {
    setPendingPatch(null);
    setPendingPatchOpen(false);
    setPendingPatchSummary(null);
    setPendingPatchMeta(null);
    pendingPatchMetaRef.current = null;
  }, []);
  
  // Plan actions
  const resetPlanState = useCallback(() => {
    setPlanResult(null);
    setPlanReviewOpen(false);
    setPendingNewGameMessages(null);
    setAcceptedPlan(null);
    setAcceptingPlan(false);
  }, []);
  
  // Validation functions
  const validateInput = useCallback(() => {
    return input.trim().length > 0;
  }, [input]);
  
  const clearInput = useCallback(() => {
    setInput("");
  }, []);
  
  const trimInput = useCallback(() => {
    setInput(prev => prev.trim());
  }, []);
  
  const validateMessages = useCallback(() => {
    return messages.every(msg => 
      msg.role === "user" || msg.role === "assistant" || msg.role === "system"
    );
  }, [messages]);
  
  const validateDebugState = useCallback(() => {
    // Basic validation - can be expanded
    return true;
  }, []);
  
  const validatePatchState = useCallback(() => {
    if (pendingPatch && !pendingPatch.kind) return false;
    return true;
  }, [pendingPatch]);
  
  const validatePlanState = useCallback(() => {
    if (planResult && !planResult.plan) return false;
    return true;
  }, [planResult]);
  
  // Derived state
  const isEditMode = useMemo(() => !!currentSpec, [currentSpec]);
  
  const codeEntryPath = useMemo(() => {
    return gameId ? `/vfs/games/${gameId}/codeGame.ts` : undefined;
  }, [gameId]);
  
  const isCodeMutatorMode = useMemo(() => {
    return !!(isEditMode && gameId && codeEntryPath);
  }, [isEditMode, gameId, codeEntryPath]);
  
  const placeholder = useMemo(() => {
    if (isCodeMutatorMode && gameId) {
      return PLACEHOLDERS.CODE_MUTATOR(gameId);
    } else if (isEditMode) {
      return PLACEHOLDERS.EDIT_MODE;
    } else {
      return PLACEHOLDERS.NEW_GAME;
    }
  }, [isCodeMutatorMode, isEditMode, gameId]);
  
  const stageLabel = useMemo(() => {
    return STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? "";
  }, [stage]);
  
  const loadingBubbleText = useMemo(() => {
    if (stageLabel) return stageLabel;
    return STAGE_LABELS.LOADING_FALLBACK;
  }, [stageLabel]);
  
  const debugSummary = useMemo(() => {
    if (!debugSanitized.trim()) return null;
    
    try {
      const parsed = JSON.parse(debugSanitized);
      const entities = parsed?.scene?.entities?.length ?? 0;
      const systems = parsed?.systems?.length ?? 0;
      const gameType = parsed?.gameType ?? "unknown";
      
      return { entities, systems, gameType };
    } catch {
      return null;
    }
  }, [debugSanitized]);
  
  // Sync pendingPatchMeta ref
  const handleSetPendingPatchMeta = useCallback((meta: { assistantSummary?: string; appliedEdits?: string[] } | null) => {
    setPendingPatchMeta(meta);
    pendingPatchMetaRef.current = meta;
  }, []);
  
  const handleSetPendingPatchSummary = useCallback((summary: { touchedDirs?: string[]; warnings?: string[] } | null) => {
    setPendingPatchSummary(summary);
  }, []);
  
  return {
    // State
    input,
    isLoading,
    isStreaming,
    streamingContent,
    messages,
    messagesRef,
    compilerPhase,
    sessionId,
    compilerResponses,
    stage,
    debugRaw,
    debugSanitized,
    debugError,
    debugFixes,
    showDebug,
    pendingPatch,
    pendingPatchOpen,
    pendingPatchSummary,
    pendingPatchMeta,
    planResult,
    planReviewOpen,
    pendingNewGameMessages,
    acceptedPlan,
    acceptedPlanHuman: lastUserPromptRef.current,
    acceptingPlan,
    streamingClientRef,
    lastUserPromptRef,
    pendingPatchMetaRef,
    shouldStickToBottomRef,
    userIdRef,
    
    // Input actions
    setInput,
    validateInput,
    clearInput,
    trimInput,
    
    // Loading actions
    setIsLoading,
    setIsStreaming,
    setStreamingContent,
    
    // Messages actions
    setMessages: handleSetMessages,
    addMessage,
    clearMessages,
    validateMessages,
    
    // Compiler actions
    setCompilerPhase,
    setSessionId,
    setStage,
    addResponse,
    resetCompilerState,
    
    // Debug actions
    setDebugRaw,
    setDebugSanitized,
    setDebugError,
    setDebugFixes,
    setShowDebug,
    resetDebug,
    validateDebugState,
    
    // Patch actions
    setPendingPatch,
    setPendingPatchOpen,
    setPendingPatchSummary: handleSetPendingPatchSummary,
    setPendingPatchMeta: handleSetPendingPatchMeta,
    resetPatchState,
    validatePatchState,
    
    // Plan actions
    setPlanResult,
    setPlanReviewOpen,
    setPendingNewGameMessages,
    setAcceptedPlan,
    setAcceptingPlan,
    resetPlanState,
    validatePlanState,
    
    // Derived state
    isEditMode,
    codeEntryPath,
    isCodeMutatorMode,
    placeholder,
    stageLabel,
    loadingBubbleText,
    debugSummary,
  };
};