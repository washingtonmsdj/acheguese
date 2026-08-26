/**
 * SSOT - Optimized Locations Hook
 * 
 * Hook otimizado para locations usando estratégias de cache do SSOT.
 * 
 * Estratégia: STATIC (staleTime: 24h, gcTime: 7 dias)
 * - Locations raramente mudam
 * - Cache agressivo para reduzir API calls
 * - Prefetch para melhor UX
 * 
 * @see src/shared/config/reactQuery.config.ts - Configuração de cache
 * @version 1.0.0
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS, createQueryOptions } from '@/shared/config/reactQuery.config';
import { LocationsReadService } from '@/core/location/services/LocationsReadService';
/**
 * Location type
 */
export interface Location {
  id: string;
  name: string;
  type: 'country' | 'state' | 'city' | 'district' | 'neighborhood';
  parent_id?: string;
  slug: string;
  created_at: string;
}

/**
 * Location Service
 */
/**
 * Hook para buscar todas as locations
 * 
 * Usa estratégia STATIC (24h cache)
 * Ideal para dropdowns e seletores
 */
export function useLocations() {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.all,
      () => LocationsReadService.getAll(),
      'STATIC' // 24h cache
    ),
  });
}

/**
 * Hook para buscar location por ID
 * 
 * Usa estratégia STATIC (24h cache)
 */
export function useLocation(id: string | undefined) {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.byId(id || ''),
      () => LocationsReadService.getById(id!),
      'STATIC',
      {
        enabled: !!id,
      }
    ),
  });
}

/**
 * Hook para buscar locations por tipo
 * 
 * Usa estratégia STATIC (24h cache)
 */
export function useLocationsByType(type: Location['type']) {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.byType(type),
      () => LocationsReadService.getByType(type),
      'STATIC'
    ),
  });
}

/**
 * Hook para buscar árvore de locations
 * 
 * Usa estratégia STATIC (24h cache)
 * Ideal para navegação hierárquica
 */
export function useLocationTree() {
  return useQuery({
    ...createQueryOptions(
      QUERY_KEYS.locations.tree,
      () => LocationsReadService.getTree(),
      'STATIC'
    ),
  });
}

/**
 * Hook para prefetch de locations
 * 
 * Carrega locations em background para melhor UX
 * Use em páginas que provavelmente vão precisar de locations
 */
export function usePrefetchLocations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch all locations
    queryClient.prefetchQuery({
      ...createQueryOptions(
        QUERY_KEYS.locations.all,
        () => LocationsReadService.getAll(),
        'STATIC'
      ),
    });

    // Prefetch location tree
    queryClient.prefetchQuery({
      ...createQueryOptions(
        QUERY_KEYS.locations.tree,
        () => LocationsReadService.getTree(),
        'STATIC'
      ),
    });
  }, [queryClient]);
}

/**
 * Hook para prefetch de location específica
 * 
 * Use quando souber que o usuário vai acessar uma location
 */
export function usePrefetchLocation(id: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;

    queryClient.prefetchQuery({
      ...createQueryOptions(
        QUERY_KEYS.locations.byId(id),
        () => LocationsReadService.getById(id),
        'STATIC'
      ),
    });
  }, [id, queryClient]);
}
