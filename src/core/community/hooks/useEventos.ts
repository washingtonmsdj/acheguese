/**
 * useEventos Hook - SSOT + territorial.
 */

import { useQuery } from "@tanstack/react-query";
import {
  communityEventsRuntimeService,
  type CommunityEvent,
} from "@/core/community/services/CommunityEventsRuntimeService";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import type { RouteResolved } from "@/core/routing/types";

export type Evento = CommunityEvent;

interface UseEventosOptions {
  routeResolved?: RouteResolved;
  filters?: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function useEventos(options: UseEventosOptions = {}) {
  const { filters, routeResolved } = options;
  const territoryFilter = useTerritoryFilter(routeResolved);

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