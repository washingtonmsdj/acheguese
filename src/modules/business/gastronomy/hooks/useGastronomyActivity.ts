/**
 * useGastronomyActivity - Hook para feed publico de reviews
 *
 * SSOT para consumir atividades publicas de gastronomia.
 *
 * @example
 * ```tsx
 * const { data: activities, isLoading } = useGastronomyActivity({
 *   territoryFilter,
 *   limit: 5,
 * });
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { ActivityQueryService } from '@/core/business/services/gastronomy.activity.queries';
import type { GastronomyActivityFilters } from '../types/gastronomy';

/**
 * Hook para buscar atividades recentes de gastronomia
 *
 * @param filters - Filtros de território e tipos de atividade
 * @param options - Opções do React Query
 * @returns Query com atividades recentes
 */
export function useGastronomyActivity(
  filters: GastronomyActivityFilters = {},
  options: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  } = {}
) {
  const { enabled = true, staleTime = 1000 * 60 * 2, refetchInterval } = options;

  return useQuery({
    queryKey: ['gastronomy', 'activities', filters],
    queryFn: () => ActivityQueryService.getRecentActivities(filters),
    enabled,
    staleTime, // 2 minutos por padrão
    refetchInterval, // Opcional: auto-refresh
  });
}

/**
 * Hook para buscar atividades de um usuário específico
 *
 * @param userId - ID do usuário
 * @param limit - Número máximo de atividades
 * @returns Query com atividades do usuário
 */
export function useUserActivity(userId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['gastronomy', 'activities', 'user', userId, limit],
    queryFn: () => ActivityQueryService.getUserActivities(userId!, limit),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar atividades de um estabelecimento
 *
 * @param businessId - ID do estabelecimento
 * @param limit - Número máximo de atividades
 * @returns Query com atividades do estabelecimento
 */
export function useBusinessActivity(businessId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['gastronomy', 'activities', 'business', businessId, limit],
    queryFn: () => ActivityQueryService.getBusinessActivities(businessId!, limit),
    enabled: Boolean(businessId),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
