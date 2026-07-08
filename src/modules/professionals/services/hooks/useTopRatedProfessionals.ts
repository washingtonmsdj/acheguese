import { useQuery } from "@tanstack/react-query";

import { ProfessionalFacade } from "@/core/professional/services";
import type { TerritoryFilter } from "@/core/location/types";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
  useTerritoryFilter,
} from "@/core/location/hooks/useTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { mapProfessionalToItem } from "@/modules/professionals/services/domain/professionalViewModels";
import type { ProfessionalItem } from "@/modules/professionals/services/domain/professionalViewModels";

interface UseTopRatedProfessionalsOptions {
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  limit?: number;
  territoryFilter?: TerritoryFilter;
}

export function useTopRatedProfessionals(options: UseTopRatedProfessionalsOptions = {}) {
  const { routeResolved, activeMemberIds, limit = 5, territoryFilter } = options;
  const routeFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const effectiveTerritoryFilter = territoryFilter ?? routeFilter;
  const filterReady = isTerritoryFilterReady(effectiveTerritoryFilter);
  const filterKey = territoryFilterKey(effectiveTerritoryFilter);

  const { data } = useQuery({
    queryKey: ["top-rated-professionals", filterKey, limit],
    queryFn: async () => {
      const result = await ProfessionalFacade.queries.getProfessionalsList({
        pageParam: 0,
        category: undefined,
        territory: effectiveTerritoryFilter,
      });
      const professionals = result.professionals.slice(0, limit);
      return professionals.map(mapProfessionalToItem);
    },
    enabled: filterReady,
  });

  return { topRated: data || [] };
}
