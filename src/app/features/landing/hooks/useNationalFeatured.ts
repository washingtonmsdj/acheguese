/**
 * useNationalFeatured
 *
 * Hook de estado para vitrine nacional.
 * Acesso a dados é delegado para LandingService (SSOT).
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  getNationalBusinesses,
  getNationalServices,
  getNationalClassifieds,
  getNationalStats,
  getActiveTerritoriesWithLanding,
} from '../services/LandingService';
import type {
  ActiveTerritoriesWithLanding,
  NationalStats,
} from '../services/types';

export type {
  NationalBusiness,
  NationalClassified,
  NationalService,
  NationalStats,
} from '../services/types';
export type ActiveTerritory = ActiveTerritoriesWithLanding['locations'][number];
export type ActiveGroup = ActiveTerritoriesWithLanding['groups'][number];

const STALE_TIME = 5 * 60 * 1000;

const DEFAULT_STATS: NationalStats = { businesses: 0, services: 0, classifieds: 0, cities: 0, districts: 0 };

const DEFAULT_TERRITORIES: ActiveTerritoriesWithLanding = { locations: [], groups: [] };

export function useNationalFeatured() {
  const businesses = useQuery({
    queryKey: ['national', 'businesses'],
    queryFn: () => getNationalBusinesses(6),
    staleTime: STALE_TIME,
  });

  const services = useQuery({
    queryKey: ['national', 'services'],
    queryFn: () => getNationalServices(6),
    staleTime: STALE_TIME,
  });

  const classifieds = useQuery({
    queryKey: ['national', 'classifieds'],
    queryFn: () => getNationalClassifieds(6),
    staleTime: STALE_TIME,
  });

  const stats = useQuery({
    queryKey: ['national', 'stats'],
    queryFn: () => getNationalStats(),
    staleTime: STALE_TIME,
  });

  const territories = useQuery({
    queryKey: ['national', 'territories'],
    queryFn: () => getActiveTerritoriesWithLanding(),
    staleTime: STALE_TIME,
  });

  return useMemo(() => ({
    businesses: businesses.data ?? [],
    services: services.data ?? [],
    classifieds: classifieds.data ?? [],
    stats: stats.data ?? DEFAULT_STATS,
    territories: territories.data ?? DEFAULT_TERRITORIES,
    isLoading:
      businesses.isLoading ||
      services.isLoading ||
      classifieds.isLoading ||
      stats.isLoading ||
      territories.isLoading,
  }), [
    businesses.data,
    businesses.isLoading,
    services.data,
    services.isLoading,
    classifieds.data,
    classifieds.isLoading,
    stats.data,
    stats.isLoading,
    territories.data,
    territories.isLoading,
  ]);
}

