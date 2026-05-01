/**
 * useEventos Hook - SSOT + territorial.
 */

import { useQuery } from "@tanstack/react-query";
import {
  communityEventsRuntimeService,
  type CommunityEvent,
} from "@/core/community/services/CommunityEventsRuntimeService";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import type { RouteResolved } from "@/core/routing/types";

export type Evento = CommunityEvent;

interface UseEventosOptions {
  routeResolved?: RouteResolved;
  enabled?: boolean;
  filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  territoryFilter?: TerritoryFilter;
}

export function useEventos(options: UseEventosOptions = {}) {
  const { filters, routeResolved } = options;
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved });
  const territoryFilter = options.territoryFilter ?? moduleTerritory.territoryFilter;

  const query = useQuery({
    queryKey: ["eventos", filters, territoryFilter],
    queryFn: async () => {
      const events = await communityEventsRuntimeService.getEvents({
        category: filters?.category,
        upcoming: true,
        territoryFilter,
      });

      if (!filters?.search) {
        return events;
      }

      const searchLower = filters.search.toLowerCase();
      return events.filter((event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower),
      );
    },
    enabled: options.enabled ?? true,
  });

  return {
    eventos: query.data || [],
    isLoading: query.isLoading,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: () => {},
    error: query.error,
  };
}
