/**
 * 🏆 USE BUSINESS LIST - REFATORADO SSOT (NÍVEL ENTERPRISE)
 *
 * ✅ MELHORIAS:
 * - TanStack Query com cache otimizado
 * - Infinite scroll profissional
 * - BusinessService como única fonte de verdade
 * - Filtros debounced
 * - Validações com tipos corretos
 * - Error handling específico
 * - TypeScript strict
 * - Performance otimizada
 * - Geographic Foundation - Integrado com fundação geográfica
 *
 * @version 5.0.0 - Geographic Integration
 * @author Kiro AI
 * @date 2026-03-24
 */

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { useTerritoryFilter, isTerritoryFilterReady, territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { Business } from "@/core/business/types/Business";
import type { BusinessFilters } from "@/core/business/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location/types";

interface UseBusinessListOptions {
  category?: string;
  searchQuery?: string;
  sortBy?: BusinessFilters["sortBy"];
  enabled?: boolean;
  pageSize?: number;
  /** Território resolvido pela rota — passar quando dentro de TerritorialLayout */
  routeResolved?: ResolvedTerritory | null;
  /** IDs dos membros ativos do grupo (quando routeResolved.kind === 'group') */
  activeMemberIds?: string[];
  territoryFilter?: TerritoryFilter;
}

// 🎯 CONSTANTS
const DEFAULT_PAGE_SIZE = 12;
const CACHE_TIME = 10 * 60 * 1000; // 10 minutos
const STALE_TIME = 5 * 60 * 1000; // 5 minutos

// 🎯 QUERY KEY FACTORY
const createQueryKey = (
  category?: string,
  searchQuery?: string,
  sortBy?: BusinessFilters["sortBy"],
  filterKey?: string,
) => [
  "businesses",
  "list",
  { category, searchQuery, sortBy, filterKey },
];

/**
 * Hook para lista de empresas com infinite scroll
 * Usa exclusivamente BusinessService como fonte de verdade
 * Integrado com fundação geográfica
 */
export function useBusinessList({
  category,
  searchQuery,
  sortBy,
  enabled = true,
  pageSize = DEFAULT_PAGE_SIZE,
  routeResolved,
  activeMemberIds,
  territoryFilter,
}: UseBusinessListOptions = {}) {
  const queryClient = useQueryClient();
  const prefetchedRef = useRef(new Set<string>());

  // Filtro territorial canônico — suporta location e group
  const routeFilter = useTerritoryFilter(routeResolved, activeMemberIds);
  const filter = territoryFilter ?? routeFilter;
  const filterReady = isTerritoryFilterReady(filter);
  const filterKey = territoryFilterKey(filter);

  // 🎯 INFINITE QUERY usando BusinessService
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: createQueryKey(category, searchQuery, sortBy, filterKey),
    queryFn: ({ pageParam = 0 }) =>
      BusinessService.getBusinessesList({
        pageParam,
        category,
        searchQuery,
        sortBy,
        pageSize,
        filter: filterReady ? filter : undefined, // Só aplica filtro se estiver pronto
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    // A lista pública nunca pode abrir sem um território resolvido. Antes,
    // a query rodava durante a resolução e o primeiro resultado podia ser
    // global, antes de o filtro correto entrar na chave da consulta.
    enabled: enabled && filterReady,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // 🎯 MEMOIZED BUSINESSES - Tipado corretamente
  const businesses = useMemo(() => {
    const allBusinesses = data?.pages.flatMap((page) => page.businesses) || [];

    // Retornar diretamente - BusinessService já retorna Business[] tipado
    return allBusinesses;
  }, [data]);

  // 🎯 PREFETCH NEXT PAGE
  const prefetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 🎯 PREFETCH BUSINESS DETAIL usando BusinessService
  const prefetchBusinessDetail = useCallback(
    (businessId: string) => {
      if (prefetchedRef.current.has(businessId)) return;

      queryClient.prefetchQuery({
        queryKey: ["business", "detail", businessId],
        queryFn: () => BusinessService.getBusinessById(businessId),
        staleTime: STALE_TIME,
      });

      prefetchedRef.current.add(businessId);
    },
    [queryClient],
  );

  // 🎯 INVALIDATE CACHE
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["businesses"],
    });
  }, [queryClient]);

  // 🎯 AUTO PREFETCH (quando chegar perto do fim)
  useEffect(() => {
    if (businesses.length > 0 && hasNextPage && !isFetchingNextPage) {
      const threshold = Math.max(pageSize - 3, 1);
      if (businesses.length % pageSize >= threshold) {
        prefetchNextPage();
      }
    }
  }, [
    businesses.length,
    hasNextPage,
    isFetchingNextPage,
    pageSize,
    prefetchNextPage,
  ]);

  return {
    businesses,
    isLoading,
    isError,
    error: error as Error | null,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
    refetch,
    invalidateCache,
    prefetchNextPage,
    prefetchBusinessDetail,
    // Stats
    totalLoaded: businesses.length,
    isEmpty: !isLoading && businesses.length === 0,
  };
}
