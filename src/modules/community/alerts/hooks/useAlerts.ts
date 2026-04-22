/**
 * useAlerts — Hook para buscar alertas comunitários
 * Integrado com SSOT territorial via TerritoryFilter
 */

import { useQuery } from "@tanstack/react-query";
import { communityAlertService } from "../services/CommunityAlertService";
import { territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import type { AlertCategory, CommunityAlertPublic } from "../domain/types";

interface UseAlertsOptions {
  territoryFilter: TerritoryFilter;
  category?: AlertCategory;
  limit?: number;
}

export function useAlerts({ territoryFilter, category, limit }: UseAlertsOptions) {
  return useQuery<CommunityAlertPublic[], Error>({
    queryKey: ["community-alerts", territoryFilterKey(territoryFilter), category, limit],
    queryFn: () => communityAlertService.getByTerritory(territoryFilter, { category, limit }),
    enabled: territoryFilter.scope !== 'none',
    staleTime: 30_000,      // 30s — alertas mudam com frequência
    refetchInterval: 60_000, // revalida a cada 1min automaticamente
  });
}
