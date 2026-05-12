/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useRecomendacoes - Hook para listar perguntas Q&A
 *
 * Q&A e territorial: filtra por location_id ou location_ids.
 * Usa useTerritoryFilter para resolver o territorio ativo.
 */

import { useEffect, useCallback, useRef } from "react";
import {
  useInfiniteScroll,
  usePaginatedState,
} from "@/shared/hooks/useInfiniteScroll";
import { CommunityQAService } from "@/core/community/services/CommunityQAService";
import {
  territoryFilterKey,
  useTerritoryFilter,
} from "@/core/location/hooks/useTerritoryFilter";
import type { CommunityQuestion, QuestionFilters } from "@/core/community/qa-types";
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

export function useRecomendacoes({
  filter = "todos",
  search = "",
  routeResolved,
  activeMemberIds,
  territoryFilter,
}: UseRecomendacoesProps = {}) {
  const {
    items: questions,
    page,
    hasMore,
    loading,
    initialLoading,
    setLoading,
    setInitialLoading,
    appendItems,
    nextPage,
    reset,
    PAGE_SIZE,
  } = usePaginatedState<CommunityQuestion>();

  const routeTerritoryFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const activeTerritoryFilter = territoryFilter ?? routeTerritoryFilter;
  const activeTerritoryFilterKey = territoryFilterKey(activeTerritoryFilter);
  const activeTerritoryFilterRef = useRef(activeTerritoryFilter);

  useEffect(() => {
    activeTerritoryFilterRef.current = activeTerritoryFilter;
  }, [activeTerritoryFilterKey, activeTerritoryFilter]);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const resolvedTerritoryFilter = activeTerritoryFilterRef.current;

      if (resolvedTerritoryFilter.scope === "none") {
        setInitialLoading(false);
        return;
      }

      setLoading(true);
      const from = pageNum * PAGE_SIZE;

      const filters: QuestionFilters = {
        category: filter !== "todos" ? filter : undefined,
        limit: PAGE_SIZE,
        offset: from,
        ...(resolvedTerritoryFilter.scope === "location"
          ? { location_id: resolvedTerritoryFilter.location_id }
          : { location_ids: resolvedTerritoryFilter.location_ids }),
      };

      const data = await CommunityQAService.getQuestions(filters);
      appendItems(data, pageNum === 0);

      setLoading(false);
      setInitialLoading(false);
    },
    [filter, PAGE_SIZE, activeTerritoryFilterKey, setLoading, setInitialLoading, appendItems],
  );

  useEffect(() => {
    reset();
    fetchPage(0);
  }, [reset, fetchPage]);

  useEffect(() => {
    if (page > 0) fetchPage(page);
  }, [page, fetchPage]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: nextPage,
  });

  const filteredQuestions = questions.filter((question) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      question.titulo?.toLowerCase().includes(searchLower) ||
      question.description?.toLowerCase().includes(searchLower)
    );
  });

  return {
    questions: filteredQuestions,
    loading,
    initialLoading,
    hasMore,
    sentinelRef,
    refetch: () => {
      reset();
      fetchPage(0);
    },
  };
}
