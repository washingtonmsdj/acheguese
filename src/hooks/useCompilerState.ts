import { useState, useCallback } from "react";
import type { CompilerResponse, CompilerPhase } from "@/lib/ordax/types";

type ChatStage =
  | "idle"
  | "planning"
  | "awaiting_accept"
  | "generating"
  | "applying"
  | "coaching";

interface UseCompilerStateProps {
  initialPhase?: CompilerPhase;
  initialStage?: ChatStage;
}

/**
 * Hook para gerenciar o estado do compilador
 */
export function useCompilerState({ 
  initialPhase = "interpretation",
  initialStage = "idle"
}: UseCompilerStateProps = {}) {
  const [phase, setPhase] = useState<CompilerPhase>(initialPhase);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [responses, setResponses] = useState<CompilerResponse[]>([]);
  const [stage, setStage] = useState<ChatStage>(initialStage);

  const reset = useCallback(() => {
    setPhase("interpretation");
    setSessionId(null);
    setResponses([]);
    setStage("idle");
  }, []);

  const addResponse = useCallback((response: CompilerResponse) => {
    setResponses((prev) => [...prev, response]);
  }, []);

  const updatePhase = useCallback((newPhase: CompilerPhase) => {
    setPhase(newPhase);
  }, []);

  const updateSessionId = useCallback((newSessionId: string) => {
    setSessionId(newSessionId);
  }, []);

  return {
    phase,
    sessionId,
    responses,
    stage,
    setPhase: updatePhase,
    setSessionId: updateSessionId,
    setStage,
    addResponse,
    reset,
  };
}
