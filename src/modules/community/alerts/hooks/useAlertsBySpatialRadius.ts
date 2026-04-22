/**
 * useAlertsBySpatialRadius — Hook para buscar alertas por raio geográfico (mapa)
 * Usa centroide do território, não localização exata do usuário
 */

import { useQuery } from "@tanstack/react-query";
import { communityAlertService } from "../services/CommunityAlertService";
import { territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";

interface UseAlertsBySpatialRadiusOptions {
  center: [number, number]; // [latitude, longitude]
  radiusMeters: number;
  territoryFilter?: TerritoryFilter;
  limit?: number;
  enabled?: boolean;
}

export function useAlertsBySpatialRadius({
  center,
  radiusMeters,
  territoryFilter,
  limit,
  enabled = true,
}: UseAlertsBySpatialRadiusOptions) {
  const [lat, lng] = center;
  const territoryKey = territoryFilter ? territoryFilterKey(territoryFilter) : 'none';

  return useQuery({
    queryKey: ["community-alerts-spatial", lat, lng, radiusMeters, territoryKey, limit],
    queryFn: () =>
      communityAlertService.getBySpatialRadius(center, radiusMeters, {
        territoryFilter,
        limit,
      }),
    enabled: enabled && lat !== 0 && lng !== 0,
    staleTime: 30_000, // 30s
    gcTime: 5 * 60 * 1000, // 5min
  });
}
