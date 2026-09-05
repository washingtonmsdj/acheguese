/**
 * useIssues - Busca problemas urbanos por territorio (SSOT territorial)
 */

import { useQuery } from "@tanstack/react-query";
import { territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import { communityIssueService } from "../services/CommunityIssueService";
import type { CommunityIssuePublic, IssueCategory, IssueStatus } from "../domain/types";

interface UseIssuesOptions {
  territoryFilter: TerritoryFilter;
  category?: IssueCategory;
  status?: IssueStatus;
  limit?: number;
}

export function useIssues({ territoryFilter, category, status, limit }: UseIssuesOptions) {
  return useQuery<CommunityIssuePublic[], Error>({
    queryKey: ["community-issues", territoryFilterKey(territoryFilter), category, status, limit],
    queryFn: () =>
      communityIssueService.getByTerritory(territoryFilter, { category, status, limit }),
    enabled: territoryFilter.scope !== "none",
    staleTime: 60_000, // 1min - problemas mudam menos que alertas
    refetchInterval: 300_000, // revalida a cada 5min
  });
}
