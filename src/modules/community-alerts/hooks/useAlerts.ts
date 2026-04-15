/**
 * useAlerts — Busca alertas ativos por região
 */

import { useQuery } from "@tanstack/react-query";
import { communityAlertService } from "../services/CommunityAlertService";
import type { AlertFeedFilters } from "../domain/types";

export function useAlerts(filters: AlertFeedFilters) {
  return useQuery({
    queryKey: ["community-alerts", filters],
    queryFn: () => communityAlertService.getAlerts(filters),
    enabled: !!filters.city,
    staleTime: 30_000,      // 30s — alertas mudam com frequência
    refetchInterval: 60_000, // revalida a cada 1min automaticamente
  });
}
