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
} from '@/app/features/landing/services/LandingService';

const STALE_TIME = 5 * 60 * 1000;

const DEFAULT_STATS: NationalStats = { businesses: 0, services: 0, classifieds: 0, cities: 0, districts: 0 };

const DEFAULT_TERRITORIES = { locations: [] as ActiveTerritory[], groups: [] as ActiveGroup[] };

export interface NationalBusiness {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  slug?: string;
  geographic_path?: string;
  city_name?: string;
}

export interface NationalService {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_verified: boolean;
  price_range?: string;
  city_name?: string;
}

export interface NationalClassified {
  id: string;
  titulo: string;
  category: string;
  price: number;
  photos: string[];
  created_at: string;
  public_id?: string;
  slug?: string;
  geographic_path?: string;
  category_slug?: string;
  subcategory_slug?: string;
}

export interface NationalStats {
  businesses: number;
  services: number;
  classifieds: number;
  cities: number;
  districts: number;
}

export interface ActiveTerritory {
  id: string;
  name: string;
  slug: string;
  type: 'city' | 'district';
  geographic_path: string;
  parent_name?: string;
}

export interface ActiveGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  member_count: number;
  anchor_path?: string;
}

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

