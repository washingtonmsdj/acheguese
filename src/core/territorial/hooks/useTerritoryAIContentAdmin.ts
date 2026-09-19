import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TerritorialAIService,
  type TerritoryAIAdminContent,
  type TerritoryAIContentUpdateInput,
} from "@/core/territorial/services/TerritorialAIService";

export function useTerritoryAIContentAdmin(territorySlug: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery<TerritoryAIAdminContent | null>({
    queryKey: ["territory-ai-content", "admin", territorySlug],
    queryFn: () =>
      territorySlug ? TerritorialAIService.getAdminContent(territorySlug) : null,
    enabled: Boolean(territorySlug),
    staleTime: 5 * 60 * 1000,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["territory-ai-content", "admin", territorySlug],
      }),
      queryClient.invalidateQueries({
        queryKey: ["territory-ai-content", "public", territorySlug],
      }),
    ]);
  };

  const generateWithAI = useMutation({
    mutationFn: () => {
      if (!territorySlug) throw new Error("No territory slug");
      return TerritorialAIService.generateAIContent(territorySlug);
    },
    onSuccess: refresh,
  });

  const updateContent = useMutation({
    mutationFn: (updates: TerritoryAIContentUpdateInput) => {
      if (!territorySlug) throw new Error("No territory slug");
      return TerritorialAIService.updateAIContent(territorySlug, updates);
    },
    onSuccess: refresh,
  });

  return {
    content: query.data,
    isLoading: query.isLoading,
    generateWithAI,
    updateContent,
  };
}
