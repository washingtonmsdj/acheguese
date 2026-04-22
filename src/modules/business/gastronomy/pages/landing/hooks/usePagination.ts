/**
 * Hook para gerenciar paginação e carregamento incremental
 */

import { useCallback, useEffect, useState } from 'react';
import { INITIAL_VISIBLE_COUNT, LOAD_MORE_INCREMENT } from '../constants';

interface UsePaginationParams {
  totalItems: number;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  resetTriggers?: unknown[];
}

export function usePagination(params: UsePaginationParams) {
  const { totalItems, hasNextPage, fetchNextPage, resetTriggers = [] } = params;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // Reset quando os triggers mudarem (ex: filtros, busca)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    // resetTriggers é serializado como dependência — cada elemento é comparado individualmente
  }, resetTriggers);

  const handleLoadMore = useCallback(() => {
    const nextVisibleCount = visibleCount + LOAD_MORE_INCREMENT;
    if (nextVisibleCount > totalItems && hasNextPage) {
      fetchNextPage();
    }

    setVisibleCount((current) => current + LOAD_MORE_INCREMENT);
  }, [fetchNextPage, hasNextPage, totalItems, visibleCount]);

  const canLoadMore = visibleCount < totalItems || hasNextPage;

  return {
    visibleCount,
    canLoadMore,
    handleLoadMore,
  };
}
