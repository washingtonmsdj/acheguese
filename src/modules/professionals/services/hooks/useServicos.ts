import { useRef } from "react";
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

export type { ProfessionalItem } from "@/modules/professionals/services/domain/professionalViewModels";

interface UseServicosOptions {
  sortBy?: "created_at" | "rating";
  filter?: string;
  search?: string;
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  territoryFilter?: TerritoryFilter;
}

export function useServicos(options: UseServicosOptions = {}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    sortBy = "created_at",
    filter,
    search,
    routeResolved,
    activeMemberIds,
    territoryFilter,
  } = options;

  const routeFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const effectiveTerritoryFilter = territoryFilter ?? routeFilter;
  const filterReady = isTerritoryFilterReady(effectiveTerritoryFilter);
  const filterKey = territoryFilterKey(effectiveTerritoryFilter);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["servicos", sortBy, filter, search, filterKey],
    queryFn: async () => {
      const professionals = await ProfessionalFacade.queries.getProfessionals({
        sortBy: sortBy === "rating" ? "rating" : undefined,
        category: filter && filter !== "todos" ? filter : undefined,
        search: search || undefined,
        territoryFilter: effectiveTerritoryFilter,
      });

      return professionals.map(mapProfessionalToItem);
    },
    enabled: filterReady,
  });

  return {
    professionals: data || [],
    loading: isFetching,
    initialLoading: isLoading,
    sentinelRef,
  };
}
