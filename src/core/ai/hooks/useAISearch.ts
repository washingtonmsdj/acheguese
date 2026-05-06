import { useCallback, useState } from "react";
import { aiOrchestratorService } from "../orchestrator/AIOrchestratorService";
import type { AIActionResult, AISearchContext } from "../domain/types";

interface AISearchState {
  result: AIActionResult | null;
  loading: boolean;
  error: string | null;
}

export function useAISearch() {
  const [state, setState] = useState<AISearchState>({
    result: null,
    loading: false,
    error: null,
  });

  const search = useCallback(async (query: string, context: AISearchContext) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const result = await aiOrchestratorService.search({ query: trimmed, context });
      setState({ result, loading: false, error: null });
    } catch (error) {
      setState({
        result: null,
        loading: false,
        error: error instanceof Error ? error.message : "Erro inesperado na busca.",
      });
    }
  }, []);

  return {
    ...state,
    search,
  };
}
