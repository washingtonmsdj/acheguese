/**
 * useLandingFeatured
 *
 * Hook que agrega os dados da landing territorial em queries paralelas e leves.
 * Usa TanStack Query com staleTime generoso (5 min) — dados de vitrine não precisam
 * ser frescos a cada render.
 *
 * Usa createLandingFeaturedService() como ponto único para dados reais da landing.
 */

import { useQuery } from '@tanstack/react-query';
import { createLandingFeaturedService } from './createLandingFeaturedService';
import { isTerritoryFilterReady, territoryFilterKey } from '@/core/location/hooks/useTerritoryFilter';
import type { TerritoryFilter } from '@/core/location/types';

const STALE_TIME = 5 * 60 * 1000;
const FEATURED_LIMIT = 4;

interface UseLandingFeaturedOptions {
  communityId?: string | null;
  enabled?: boolean;
}

export function useLandingFeatured(
  filter: TerritoryFilter,
  options: UseLandingFeaturedOptions = {},
) {
  const filterKey = territoryFilterKey(filter);
  const enabled = isTerritoryFilterReady(filter) && (options.enabled ?? true);
  const communityId = options.communityId ?? null;
  const discoveryKey = communityId ? `community:${communityId}` : `territory:${filterKey}`;
  const svc = createLandingFeaturedService();

  const businesses = useQuery({
    queryKey: ['landing', 'businesses', discoveryKey],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedBusinesses(communityId, filter, FEATURED_LIMIT)
        : svc.getFeaturedBusinesses(filter, FEATURED_LIMIT),
    enabled,
    staleTime: STALE_TIME,
  });

  const services = useQuery({
    queryKey: ['landing', 'services', discoveryKey],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedServices(communityId, filter, FEATURED_LIMIT)
        : svc.getFeaturedServices(filter, FEATURED_LIMIT),
    enabled,
    staleTime: STALE_TIME,
  });

  const gastronomy = useQuery({
    queryKey: ['landing', 'gastronomy', discoveryKey],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedGastronomyBusinesses(communityId, filter, FEATURED_LIMIT)
        : svc.getFeaturedGastronomyBusinesses(filter, FEATURED_LIMIT),
    enabled,
    staleTime: STALE_TIME,
  });

  const classifieds = useQuery({
    queryKey: ['landing', 'classifieds', discoveryKey],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedClassifieds(communityId, filter, FEATURED_LIMIT)
        : svc.getFeaturedClassifieds(filter, FEATURED_LIMIT),
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
    gastronomy:  gastronomy.data  ?? [],
    classifieds: classifieds.data ?? [],
    stats: stats.data ?? { businesses: 0, services: 0, classifieds: 0 },
    isLoading:
      businesses.isLoading ||
      services.isLoading   ||
      gastronomy.isLoading ||
      classifieds.isLoading ||
      stats.isLoading,
  };
}
