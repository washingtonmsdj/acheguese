import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ServicesService } from "../services/ServicesService";
import { useTerritoryFilter, isTerritoryFilterReady, territoryFilterKey } from "@/core/location";
import { mapProfessionalToItem } from "@/core/services/domain/professionalViewModels";
import type { ProfessionalItem } from "@/core/services/domain/professionalViewModels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export type { ProfessionalItem } from "@/core/services/domain/professionalViewModels";

interface UseServicosOptions {
  sortBy?: "created_at" | "rating";
  filter?: string;
  search?: string;
  /** TerritÃ³rio resolvido pela rota â€” passar quando dentro de TerritorialLayout */
  routeResolved?: ResolvedTerritory | null;
  /** IDs dos membros ativos do grupo (quando routeResolved.kind === 'group') */
  activeMemberIds?: string[];
}

export function useServicos(options: UseServicosOptions = {}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { sortBy = "created_at", filter, search, routeResolved, activeMemberIds } = options;

  // Filtro territorial canÃ´nico â€” suporta location e group
  const territoryFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const filterReady = isTerritoryFilterReady(territoryFilter);
  const filterKey = territoryFilterKey(territoryFilter);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["servicos", sortBy, filter, search, filterKey],
    queryFn: async () => {
      const professionals = await ServicesService.getProfessionals({
        sortBy: sortBy === "rating" ? "rating" : undefined,
        category: filter && filter !== "todos" ? filter : undefined,
        search: search || undefined,
        territoryFilter,
      });

      return professionals.map(mapProfessionalToItem);
    },
    enabled: filterReady, // SÃ³ executa com territÃ³rio resolvido
  });

  return {
    professionals: data || [],
    loading: isFetching,
    initialLoading: isLoading,
    sentinelRef,
  };
}

