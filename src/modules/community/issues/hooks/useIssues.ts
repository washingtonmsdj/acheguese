/**
 * useIssues — Busca problemas urbanos por região
 */

import { useQuery } from "@tanstack/react-query";
import { communityIssueService } from "../services/CommunityIssueService";
import type { IssueFeedFilters } from "../domain/types";

export function useIssues(filters: IssueFeedFilters) {
  return useQuery({
    queryKey: ["community-issues", filters],
    queryFn: () => communityIssueService.getIssues(filters),
    staleTime: 60_000,       // 1min — problemas mudam menos que alertas
    refetchInterval: 300_000, // revalida a cada 5min
  });
}
