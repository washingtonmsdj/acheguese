/**
 * useRecomendacoes — Hook para listar perguntas Q&A
 *
 * Q&A é territorial: filtra por location_id ou location_ids.
 * Usa useTerritoryFilter para resolver o território ativo.
 */

import { useEffect, useCallback } from "react";
import {
  useInfiniteScroll,
  usePaginatedState,
} from "@/shared/hooks/useInfiniteScroll";
import { CommunityQAService } from "@/core/community/services/CommunityQAService";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import type { CommunityQuestion, QuestionFilters } from "@/core/community/qa-types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export type QuestionItem = CommunityQuestion;

interface UseRecomendacoesProps {
  filter?: string;
  search?: string;
  routeResolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
}

export function useRecomendacoes({
  filter = "todos",
  search = "",
  routeResolved,
  activeMemberIds,
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

  // Filtro territorial canônico — suporta location e group
  const territoryFilter = useTerritoryFilter(routeResolved, activeMemberIds);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      // Não buscar sem território resolvido
      if (territoryFilter.scope === 'none') {
        setInitialLoading(false);
        return;
      }

      setLoading(true);
      const from = pageNum * PAGE_SIZE;

      const filters: QuestionFilters = {
        category: filter !== "todos" ? filter : undefined,
        limit: PAGE_SIZE,
        offset: from,
        // Filtro territorial
        ...(territoryFilter.scope === 'location'
          ? { location_id: territoryFilter.location_id }
          : { location_ids: territoryFilter.location_ids }),
      };

      const data = await CommunityQAService.getQuestions(filters);
      appendItems(data, pageNum === 0);

      setLoading(false);
      setInitialLoading(false);
    },
    [filter, PAGE_SIZE, territoryFilter, setLoading, setInitialLoading, appendItems],
  );

  useEffect(() => {
    reset();
    fetchPage(0);
  }, [filter, territoryFilter, reset, fetchPage]);

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
    refetch: () => { reset(); fetchPage(0); },
  };
}
