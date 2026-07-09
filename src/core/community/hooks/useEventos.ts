/**
 * useEventos Hook - SSOT + territorial.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  eventRuntimeService,
  type CommunityEvent,
  type EventSortBy,
  type EventSortOrder,
} from "@/core/verticals/events";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export type Evento = CommunityEvent;

interface UseEventosOptions {
  routeResolved?: ResolvedTerritory | null;
  enabled?: boolean;
  filters?: {
    category?: string;
    search?: string;
    sortBy?: EventSortBy;
    sortOrder?: EventSortOrder;
  };
  territoryFilter?: TerritoryFilter;
}

const EVENTS_PAGE_SIZE = 12;

function getRouteCacheKey(routeResolved?: ResolvedTerritory | null): string {
  if (!routeResolved) return "none";

  if (routeResolved.kind === "group") {
    return `group:${routeResolved.group.slug}`;
  }

  return `location:${routeResolved.location.slug}`;
}

export function useEventos(options: UseEventosOptions = {}) {
  const { filters, routeResolved } = options;
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved });
  const territoryFilter = options.territoryFilter ?? moduleTerritory.territoryFilter;
  const routeCacheKey = getRouteCacheKey(routeResolved);

  const query = useInfiniteQuery({
    queryKey: ["eventos", filters, territoryFilter, routeCacheKey],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 0;
      const response = await eventRuntimeService.getEventsPage({
        category: filters?.category,
        search: filters?.search,
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder,
        upcoming: true,
        page,
        pageSize: EVENTS_PAGE_SIZE,
        territoryFilter,
      });

      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: options.enabled ?? true,
  });

  const eventos = (query.data?.pages ?? []).flatMap((page) => page.items);

  return {
    eventos,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  };
}
