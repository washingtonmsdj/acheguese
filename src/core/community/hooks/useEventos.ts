/**
 * useEventos Hook - SSOT + territorial.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  communityEventsRuntimeService,
  type CommunityEvent,
  type EventSortBy,
  type EventSortOrder,
  getComplexoEventMocks,
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
const COMPLEXO_GROUP_SLUG = "complexo-do-nordeste-de-amaralina";
const COMPLEXO_DISTRICT_SLUGS = new Set([
  "nordeste-de-amaralina",
  "santa-cruz",
  "vale-das-pedrinhas",
  "chapada-do-rio-vermelho",
]);

function isComplexoContext(routeResolved?: RouteResolved): boolean {
  if (!routeResolved) return false;

  if ((routeResolved as { kind?: string }).kind === "group") {
    const group = (routeResolved as { group?: { slug?: string } }).group;
    return group?.slug === COMPLEXO_GROUP_SLUG;
  }

  if ((routeResolved as { kind?: string }).kind === "location") {
    const location = (routeResolved as { location?: { slug?: string } }).location;
    return COMPLEXO_DISTRICT_SLUGS.has(location?.slug ?? "");
  }

  return false;
}

function applyMockFilters(
  events: CommunityEvent[],
  filters?: UseEventosOptions["filters"],
): CommunityEvent[] {
  const search = filters?.search?.trim().toLowerCase();
  const filtered = events.filter((event) => {
    if (filters?.category && event.category !== filters.category) return false;
    if (!search) return true;
    return (
      event.title.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search) ||
      (event.location ?? "").toLowerCase().includes(search)
    );
  });

  const sortBy = filters?.sortBy ?? "date";
  const sortOrder = filters?.sortOrder ?? "asc";
  const direction = sortOrder === "asc" ? 1 : -1;

  return filtered.sort((a, b) => {
    if (sortBy === "current_participants") {
      return (a.current_participants - b.current_participants) * direction;
    }
    if (sortBy === "created_at") {
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
    }
    return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
  });
}

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

      if (response.items.length > 0 || !isComplexoContext(routeResolved)) {
        return response;
      }

      const mockEvents = applyMockFilters(getComplexoEventMocks(), filters);
      const start = page * EVENTS_PAGE_SIZE;
      const end = start + EVENTS_PAGE_SIZE;
      const items = mockEvents.slice(start, end);
      const hasMore = end < mockEvents.length;

      return {
        items,
        totalCount: mockEvents.length,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
      };
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
