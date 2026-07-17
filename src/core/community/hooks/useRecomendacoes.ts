/**
 * Cursor-paginated territorial Q&A query.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/config/reactQuery.config";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { CommunityQAService } from "@/core/community/services/CommunityQAService";
import {
  territoryFilterKey,
  useTerritoryFilter,
} from "@/core/location/hooks/useTerritoryFilter";
import type {
  CommunityQuestion,
  QuestionCursor,
} from "@/core/community/qa-types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";

export type QuestionItem = CommunityQuestion;

interface UseRecomendacoesProps {
  filter?: string;
  search?: string;
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  territoryFilter?: TerritoryFilter;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

export function useRecomendacoes({
  filter = "todos",
  search = "",
  routeResolved,
  activeMemberIds,
  territoryFilter,
}: UseRecomendacoesProps = {}) {
  const routeTerritoryFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const activeTerritoryFilter = territoryFilter ?? routeTerritoryFilter;
  const activeTerritoryKey = territoryFilterKey(activeTerritoryFilter);
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const queryFilters = useMemo(
    () => ({
      category: filter !== "todos" ? filter : "todos",
      search: debouncedSearch,
      territory: activeTerritoryKey,
    }),
    [activeTerritoryKey, debouncedSearch, filter],
  );

  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.community.questions(queryFilters),
    enabled: activeTerritoryFilter.scope !== "none",
    initialPageParam: null as QuestionCursor | null,
    queryFn: ({ pageParam }) =>
      CommunityQAService.getQuestionsPage({
        category: filter !== "todos" ? filter : undefined,
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        cursor: pageParam as QuestionCursor | null,
        ...(activeTerritoryFilter.scope === "location"
          ? { location_id: activeTerritoryFilter.location_id }
          : activeTerritoryFilter.scope === "group"
            ? { location_ids: activeTerritoryFilter.location_ids }
            : {}),
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const questions = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: Boolean(query.hasNextPage),
    loading: query.isFetchingNextPage,
    onLoadMore: loadMore,
  });

  return {
    questions,
    loading: query.isFetchingNextPage,
    initialLoading: query.isLoading,
    hasMore: Boolean(query.hasNextPage),
    sentinelRef,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
