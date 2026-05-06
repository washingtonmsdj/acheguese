/**
 * useCityFeatured
 * 
 * Hook para buscar conteúdo em destaque de uma cidade inteira.
 * Similar ao useLandingFeatured, mas para escopo de cidade (não bairro).
 */

import { useQuery } from '@tanstack/react-query';
import { createLandingFeaturedService } from '@/app/features/landing/hooks/createLandingFeaturedService';
import type { TerritoryFilter } from '@/core/location/types';

const STALE_TIME = 5 * 60 * 1000;

export function useCityFeatured(state: string = 'ba', city: string = 'salvador') {
  const svc = createLandingFeaturedService();
  
  // Cria filtro para cidade inteira (sem bairro específico)
  const filter: TerritoryFilter = {
    scope: "group",
    location_ids: [], // Vazio = toda a cidade
  };

  const businesses = useQuery({
    queryKey: ['city-featured', 'businesses', state, city],
    queryFn: () => svc.getFeaturedBusinesses(filter, 6), // Top 6 da cidade
    staleTime: STALE_TIME,
  });

  const services = useQuery({
    queryKey: ['city-featured', 'services', state, city],
    queryFn: () => svc.getFeaturedServices(filter, 6),
    staleTime: STALE_TIME,
  });

  const classifieds = useQuery({
    queryKey: ['city-featured', 'classifieds', state, city],
    queryFn: () => svc.getFeaturedClassifieds(filter, 6),
    staleTime: STALE_TIME,
  });

  return {
    businesses: businesses.data ?? [],
    services: services.data ?? [],
    classifieds: classifieds.data ?? [],
    isLoading: businesses.isLoading || services.isLoading || classifieds.isLoading,
  };
}


