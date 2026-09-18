import { useQuery } from "@tanstack/react-query";
import {
  TerritorialAIService,
  type TerritoryAIContent,
} from "@/core/territorial/services/TerritorialAIService";

export type { TerritoryAIContent } from "@/core/territorial/services/TerritorialAIService";

export function useTerritoryAIContent(territorySlug: string | null) {
  return useQuery<TerritoryAIContent | null>({
    queryKey: ["territory-ai-content", "public", territorySlug],
    queryFn: () =>
      territorySlug ? TerritorialAIService.getAIContent(territorySlug) : null,
    enabled: Boolean(territorySlug),
    staleTime: 10 * 60 * 1000,
  });
}
