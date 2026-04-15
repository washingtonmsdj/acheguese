/**
 * useLandingFeatured
 *
 * Hook que agrega os dados da landing territorial em queries paralelas e leves.
 * Usa TanStack Query com staleTime generoso (5 min) — dados de vitrine não precisam
 * ser frescos a cada render.
 *
 * Usa createLandingFeaturedService() para alternar entre mock e Supabase.
 */

import { useQuery } from '@tanstack/react-query';
import { createLandingFeaturedService } from './createLandingFeaturedService';
import { isTerritoryFilterReady, territoryFilterKey } from '@/core/location/hooks/useTerritoryFilter';
import type { TerritoryFilter } from '@/core/location/types';

const STALE_TIME = 5 * 60 * 1000;
const FEATURED_LIMIT = 4;

export function useLandingFeatured(filter: TerritoryFilter) {
  const filterKey = territoryFilterKey(filter);
  const enabled = isTerritoryFilterReady(filter);
  const svc = createLandingFeaturedService();

  const businesses = useQuery({
    queryKey: ['landing', 'businesses', filterKey],
    queryFn: () => svc.getFeaturedBusinesses(filter, FEATURED_LIMIT),
    enabled,
    staleTime: STALE_TIME,
  });

  const services = useQuery({
    queryKey: ['landing', 'services', filterKey],
    queryFn: () => svc.getFeaturedServices(filter, FEATURED_LIMIT),
    enabled,
    staleTime: STALE_TIME,
  });

  const classifieds = useQuery({
    queryKey: ['landing', 'classifieds', filterKey],
    queryFn: () => svc.getFeaturedClassifieds(filter, FEATURED_LIMIT),
    enabled,
    staleTime: STALE_TIME,
  });

  const stats = useQuery({
    queryKey: ['landing', 'stats', filterKey],
    queryFn: () => svc.getTerritoryStats(filter),
    enabled,
    staleTime: STALE_TIME,
  });

  return {
    businesses:  businesses.data  ?? [],
    services:    services.data    ?? [],
    classifieds: classifieds.data ?? [],
    stats: stats.data ?? { businesses: 0, services: 0, classifieds: 0 },
    isLoading:
      businesses.isLoading ||
      services.isLoading   ||
      classifieds.isLoading ||
      stats.isLoading,
  };
}
