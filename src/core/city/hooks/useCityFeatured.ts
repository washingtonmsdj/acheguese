/**
 * useCityFeatured
 *
 * Hook para buscar conteudo em destaque de uma cidade inteira.
 * Similar ao useLandingFeatured, mas para escopo de cidade (nao bairro).
 */

import { useQuery } from '@tanstack/react-query';
import { LandingFeaturedService } from '@/core/landing/services/LandingFeaturedService';
import type { TerritoryFilter } from '@/core/location/types';

const STALE_TIME = 5 * 60 * 1000;

export function useCityFeatured(
  state: string,
  city: string,
  territoryFilter: TerritoryFilter,
  options: { enabled?: boolean } = {},
) {
  const svc = LandingFeaturedService;
  const enabled = options.enabled !== false && territoryFilter.scope !== 'none';

  const businesses = useQuery({
    queryKey: ['city-featured', 'businesses', state, city],
    queryFn: () => svc.getFeaturedBusinesses(territoryFilter, 6),
    staleTime: STALE_TIME,
    enabled,
  });

  const services = useQuery({
    queryKey: ['city-featured', 'services', state, city],
    queryFn: () => svc.getFeaturedServices(territoryFilter, 6),
    staleTime: STALE_TIME,
    enabled,
  });

  const classifieds = useQuery({
    queryKey: ['city-featured', 'classifieds', state, city],
    queryFn: () => svc.getFeaturedClassifieds(territoryFilter, 6),
    staleTime: STALE_TIME,
    enabled,
  });

  return {
    businesses: businesses.data ?? [],
    services: services.data ?? [],
    classifieds: classifieds.data ?? [],
    isLoading: businesses.isLoading || services.isLoading || classifieds.isLoading,
  };
}
