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
  includeStats?: boolean;
  limit?: number;
}

export function useLandingFeatured(
  filter: TerritoryFilter,
  options: UseLandingFeaturedOptions = {},
) {
  const filterKey = territoryFilterKey(filter);
  const enabled = isTerritoryFilterReady(filter) && (options.enabled ?? true);
  const communityId = options.communityId ?? null;
  const includeStats = options.includeStats ?? true;
  const featuredLimit = options.limit ?? FEATURED_LIMIT;
  const discoveryKey = communityId ? `community:${communityId}` : `territory:${filterKey}`;
  const svc = createLandingFeaturedService();

  const businesses = useQuery({
    queryKey: ['landing', 'businesses', discoveryKey, featuredLimit],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedBusinesses(communityId, filter, featuredLimit)
        : svc.getFeaturedBusinesses(filter, featuredLimit),
    enabled,
    staleTime: STALE_TIME,
  });

  const services = useQuery({
    queryKey: ['landing', 'services', discoveryKey, featuredLimit],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedServices(communityId, filter, featuredLimit)
        : svc.getFeaturedServices(filter, featuredLimit),
    enabled,
    staleTime: STALE_TIME,
  });

  const gastronomy = useQuery({
    queryKey: ['landing', 'gastronomy', discoveryKey, featuredLimit],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedGastronomyBusinesses(communityId, filter, featuredLimit)
        : svc.getFeaturedGastronomyBusinesses(filter, featuredLimit),
    enabled,
    staleTime: STALE_TIME,
  });

  const classifieds = useQuery({
    queryKey: ['landing', 'classifieds', discoveryKey, featuredLimit],
    queryFn: () =>
      communityId
        ? svc.getCommunityFeaturedClassifieds(communityId, filter, featuredLimit)
        : svc.getFeaturedClassifieds(filter, featuredLimit),
    enabled,
    staleTime: STALE_TIME,
  });

  const stats = useQuery({
    queryKey: ['landing', 'stats', filterKey],
    queryFn: () => svc.getTerritoryStats(filter),
    enabled: enabled && includeStats,
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
      (includeStats && stats.isLoading),
    isError:
      businesses.isError ||
      services.isError ||
      gastronomy.isError ||
      classifieds.isError ||
      (includeStats && stats.isError),
  };
}
