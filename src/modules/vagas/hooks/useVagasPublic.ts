/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * USE VAGAS PUBLIC — Hook para listagem pública de vagas
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Responsabilidade:
 * - Listagem territorial com filtros e ordenação
 * - Paginação/infinite scroll
 * - Cache via React Query
 * - SSOT: usa VagasService (nunca acessa Supabase diretamente)
 * 
 * Página: /vagas/:uf/:cidade
 * 
 * @version 3.0.0 - Hook Completo AAA
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { VagasService } from '../services/VagasService';
import type {
  Vaga,
  VagaFilters,
  VagaSortOption,
  VagasPaginatedResult,
} from '../types/vagas.types';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface UseVagasPublicParams {
  locationId: string;
  initialFilters?: VagaFilters;
  initialSort?: VagaSortOption;
  pageSize?: number;
}

interface UseVagasPublicReturn {
  // Dados
  vagas: Vaga[];
  total: number;
  hasMore: boolean;
  page: number;
  
  // Estados
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetchingNextPage: boolean;
  
  // Filtros
  filters: VagaFilters;
  setFilters: (filters: VagaFilters) => void;
  updateFilter: <K extends keyof VagaFilters>(key: K, value: VagaFilters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  
  // Ordenação
  sort: VagaSortOption;
  setSort: (sort: VagaSortOption) => void;
  
  // Ações
  fetchNextPage: () => void;
  refetch: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_PAGE_SIZE = 20;
const STALE_TIME = 5 * 60 * 1000; // 5 minutos

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useVagasPublic(params: UseVagasPublicParams): UseVagasPublicReturn {
  const {
    locationId,
    initialFilters = {},
    initialSort = 'newest',
    pageSize = DEFAULT_PAGE_SIZE,
  } = params;

  // Estados locais
  const [filters, setFiltersState] = useState<VagaFilters>(initialFilters);
  const [sort, setSort] = useState<VagaSortOption>(initialSort);

  // Query key baseada em todos os parâmetros
  const queryKey = useMemo(() => 
    ['vagas', locationId, filters, sort],
    [locationId, filters, sort]
  );

  // Infinite query para paginação
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
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const result = await VagasService.getVagas({
        locationId,
        filters,
        sort,
        limit: pageSize,
        offset: pageParam,
      });
      return result;
    },
    getNextPageParam: (lastPage: VagasPaginatedResult) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page * pageSize;
    },
    initialPageParam: 0,
    staleTime: STALE_TIME,
    enabled: !!locationId,
  });

  // Flatten pages
  const vagas = useMemo(() => {
    return data?.pages.flatMap(page => page.vagas) ?? [];
  }, [data]);

  // Totais da primeira página
  const { total, page, hasMore } = useMemo(() => {
    const firstPage = data?.pages[0];
    return {
      total: firstPage?.total ?? 0,
      page: firstPage?.page ?? 1,
      hasMore: firstPage?.hasMore ?? false,
    };
  }, [data]);

  // Handlers de filtros
  const setFilters = useCallback((newFilters: VagaFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof VagaFilters>(key: K, value: VagaFilters[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => 
      v !== undefined && v !== null && 
      !(Array.isArray(v) && v.length === 0)
    );
  }, [filters]);

  return {
    // Dados
    vagas,
    total,
    hasMore,
    page,
    
    // Estados
    isLoading,
    isError,
    error: error as Error | null,
    isFetchingNextPage,
    
    // Filtros
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    
    // Ordenação
    sort,
    setSort,
    
    // Ações
    fetchNextPage,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK ESPECIALIZADO: Vagas Urgentes
// ═══════════════════════════════════════════════════════════════════════════════

export function useVagasUrgentes(locationId: string, limit = 5) {
  return useQuery({
    queryKey: ['vagas-urgentes', locationId, limit],
    queryFn: () => VagasService.getVagasUrgentes(locationId, limit),
    staleTime: STALE_TIME,
    enabled: !!locationId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK ESPECIALIZADO: Vagas em Destaque
// ═══════════════════════════════════════════════════════════════════════════════

export function useVagasDestaque(locationId: string, limit = 6) {
  return useQuery({
    queryKey: ['vagas-destaque', locationId, limit],
    queryFn: () => VagasService.getVagasDestaque(locationId, limit),
    staleTime: STALE_TIME,
    enabled: !!locationId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK ESPECIALIZADO: Bairros com Vagas
// ═══════════════════════════════════════════════════════════════════════════════

export function useBairrosComVagas(locationId: string) {
  return useQuery({
    queryKey: ['bairros-vagas', locationId],
    queryFn: () => VagasService.getBairrosComVagas(locationId),
    staleTime: STALE_TIME * 2, // Cache mais longo
    enabled: !!locationId,
  });
}
