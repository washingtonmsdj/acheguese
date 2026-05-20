/**
 * useEventos Hook - SSOT + territorial.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  communityEventsRuntimeService,
  type CommunityEvent,
  type EventSortBy,
  type EventSortOrder,
} from "@/core/community/services/CommunityEventsRuntimeService";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";
type RouteResolved = any;

export type Evento = CommunityEvent;

interface UseEventosOptions {
  routeResolved?: RouteResolved;
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
export function useEventos(options: UseEventosOptions = {}) {
  const { filters, routeResolved } = options;
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved });
  const territoryFilter = options.territoryFilter ?? moduleTerritory.territoryFilter;
  const routeCacheKey =
    (routeResolved as { kind?: string })?.kind === "group"
      ? `group:${(routeResolved as { group?: { slug?: string } }).group?.slug ?? ""}`
      : (routeResolved as { kind?: string })?.kind === "location"
        ? `location:${(routeResolved as { location?: { slug?: string } }).location?.slug ?? ""}`
        : "none";

  const query = useInfiniteQuery({
    queryKey: ["eventos", filters, territoryFilter, routeCacheKey],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 0;
      const response = await communityEventsRuntimeService.getEventsPage({
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
