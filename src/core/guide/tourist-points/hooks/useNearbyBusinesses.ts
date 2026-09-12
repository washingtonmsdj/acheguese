/**
 * useNearbyBusinesses / useNearbyGuides
 *
 * Busca empresas e guias turísticos próximos a um ponto turístico.
 * Ordena por distância Haversine quando coordenadas disponíveis.
 * Retorna apenas dados reais e usa leitura pública paginada/bounded.
 */

import { useQuery } from '@tanstack/react-query';
import { BusinessService } from '@/core/business/services/BusinessService';
import { calculateDistance } from '@/shared/utils/geolocation';
import type { Business } from '@/core/business/types/Business';
import {
  TOURIST_POINT_GUIDE_CATEGORIES,
  TOURIST_POINT_GUIDE_KEYWORDS,
  TOURIST_POINT_NEARBY_BUSINESS_CATEGORIES,
  TOURIST_POINT_NEARBY_LIMITS,
} from '../constants/nearby';

export interface NearbyBusiness extends Business {
  distanceMeters?: number;
}

function withDistance(
  businesses: Business[],
  lat: number | null,
  lng: number | null,
  maxKm: number,
): NearbyBusiness[] {
  if (!lat || !lng) return businesses.slice(0, TOURIST_POINT_NEARBY_LIMITS.MAX_RESULTS);

  return businesses
    .map((business) => {
      const businessLat = business.address?.latitude ?? null;
      const businessLng = business.address?.longitude ?? null;
      if (!businessLat || !businessLng) return { ...business, distanceMeters: undefined };
      return {
        ...business,
        distanceMeters: calculateDistance(lat, lng, businessLat, businessLng),
      };
    })
    .filter(
      (business) =>
        business.distanceMeters === undefined ||
        business.distanceMeters <= maxKm * 1000,
    )
    .sort((left, right) => {
      if (left.distanceMeters === undefined) return 1;
      if (right.distanceMeters === undefined) return -1;
      return left.distanceMeters - right.distanceMeters;
    })
    .slice(0, TOURIST_POINT_NEARBY_LIMITS.MAX_RESULTS);
}

async function fetchCategoryCandidates(category: string): Promise<Business[]> {
  const { businesses } = await BusinessService.getBusinessesList({
    category,
    sortBy: 'rating',
    pageParam: 0,
    pageSize: TOURIST_POINT_NEARBY_LIMITS.CANDIDATES_PER_CATEGORY,
  });
  return businesses;
}

async function fetchNearbyBusinesses(lat: number | null, lng: number | null) {
  const results = await Promise.all(
    TOURIST_POINT_NEARBY_BUSINESS_CATEGORIES.map(fetchCategoryCandidates),
  );

  return withDistance(
    results.flat(),
    lat,
    lng,
    TOURIST_POINT_NEARBY_LIMITS.MAX_RADIUS_KM,
  );
}

export function useNearbyBusinesses(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearby-businesses', lat, lng],
    queryFn: () => fetchNearbyBusinesses(lat, lng),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

async function fetchNearbyGuides(lat: number | null, lng: number | null) {
  const results = await Promise.all(
    TOURIST_POINT_GUIDE_CATEGORIES.map(fetchCategoryCandidates),
  );

  const guides = results.flat().filter((business) => {
    const subcategory = (business.subcategoria ?? '').toLowerCase();
    const specialties = (business.especialidades ?? []).join(' ').toLowerCase();
    const name = business.name.toLowerCase();
    const description = (business.description ?? '').toLowerCase();
    return TOURIST_POINT_GUIDE_KEYWORDS.some(
      (keyword) =>
        subcategory.includes(keyword) ||
        specialties.includes(keyword) ||
        name.includes(keyword) ||
        description.includes(keyword),
    );
  });

  return withDistance(
    guides,
    lat,
    lng,
    TOURIST_POINT_NEARBY_LIMITS.MAX_RADIUS_KM,
  );
}

export function useNearbyGuides(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearby-guides', lat, lng],
    queryFn: () => fetchNearbyGuides(lat, lng),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}