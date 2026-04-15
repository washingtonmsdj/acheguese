import { useQuery } from "@tanstack/react-query";
import { ServicesService } from "../services/ServicesService";
import { mapProfessionalToItem } from "@/modules/services/domain/professionalViewModels";
import { useTerritoryFilter, isTerritoryFilterReady, territoryFilterKey } from "@/core/location";
import type { ProfessionalItem } from "@/modules/services/domain/professionalViewModels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface UseTopRatedProfessionalsOptions {
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  limit?: number;
}

export function useTopRatedProfessionals(options: UseTopRatedProfessionalsOptions = {}) {
  const { routeResolved, activeMemberIds, limit = 5 } = options;
  const territoryFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const filterReady = isTerritoryFilterReady(territoryFilter);
  const filterKey = territoryFilterKey(territoryFilter);

  const { data } = useQuery({
    queryKey: ["top-rated-professionals", filterKey, limit],
    queryFn: async () => {
      const professionals = await ServicesService.getTopRatedProfessionals({
        limit,
        territoryFilter,
      });
      return professionals.map(mapProfessionalToItem);
    },
    enabled: filterReady,
  });

  return { topRated: data || [] };
}
