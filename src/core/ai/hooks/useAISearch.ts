import { useCallback, useState } from "react";
import { aiOrchestratorService } from "../orchestrator/AIOrchestratorService";
import type {
  AIActionResult,
  AIExecutableIntentType,
  AISearchContext,
} from "../domain/types";

interface UseAISearchOptions {
  allowedIntentTypes: readonly AIExecutableIntentType[];
}

interface AISearchState {
  result: AIActionResult | null;
  loading: boolean;
  error: string | null;
}

export function useAISearch({ allowedIntentTypes }: UseAISearchOptions) {
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
      const result = await aiOrchestratorService.search({
        query: trimmed,
        context,
        allowedIntentTypes,
      });
      setState({ result, loading: false, error: null });
    } catch (error) {
      setState({
        result: null,
        loading: false,
        error: error instanceof Error ? error.message : "Erro inesperado na busca.",
      });
    }
  }, [allowedIntentTypes]);

  return {
    ...state,
    search,
  };
}
