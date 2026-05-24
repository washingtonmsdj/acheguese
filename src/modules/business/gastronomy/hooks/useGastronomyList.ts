/**
 * Hook para listagem de negócios gastronômicos
 *
 * REGRAS:
 * - Apenas estado/fetch/loading/error
 * - Lógica de negócio no service
 * - React Query para cache
 *
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { GastronomyFacade } from '../services';
import type { GastronomyBusinessFilters } from '../types';

interface UseGastronomyListOptions {
  enabled?: boolean;
}

const DEFAULT_PAGE_SIZE = 12;

export function useGastronomyList(
  filters: GastronomyBusinessFilters = {},
  options: UseGastronomyListOptions = {},
) {
  const isQueryEnabled =
    (options.enabled ?? true) &&
    filters.territoryFilter?.scope !== 'none';

  return useInfiniteQuery({
    queryKey: ['gastronomy', 'list', filters],
    queryFn: ({ pageParam = 0 }) =>
      GastronomyFacade.queries.getGastronomyBusinessesList({
        pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        filters,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: isQueryEnabled,
  });
}
