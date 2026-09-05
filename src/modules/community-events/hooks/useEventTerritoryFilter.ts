import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export function useEventTerritoryFilter(
  resolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  return useModuleTerritoryFilter({
    routeResolved: resolved,
    activeMemberIds,
    includeDescendants: false,
  }).territoryFilter;
}
