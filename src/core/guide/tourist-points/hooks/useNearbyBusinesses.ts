/**
 * useNearbyBusinesses / useNearbyGuides
 *
 * Nearby businesses use the canonical spatial boundary first and hydrate only
 * the small result set needed by the UI. Guide discovery keeps the bounded
 * catalog path because its matching contract depends on specialty metadata
 * that is not part of the spatial projection.
 */

import { useQuery } from '@tanstack/react-query';
import { BusinessService } from '@/core/business/services/BusinessService';
import { spatialSearchService } from '@/core/geospatial/services/SpatialSearchService';
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

const NEARBY_SPATIAL_CANDIDATE_LIMIT =
  TOURIST_POINT_NEARBY_LIMITS.CANDIDATES_PER_CATEGORY *
  TOURIST_POINT_NEARBY_BUSINESS_CATEGORIES.length;

function withDistance(
  businesses: Business[],
  lat: number | null,
  lng: number | null,
  maxKm: number,
): NearbyBusiness[] {
  if (lat == null || lng == null) {
    return businesses.slice(0, TOURIST_POINT_NEARBY_LIMITS.MAX_RESULTS);
  }

  return businesses
    .map((business) => {
      const businessLat = business.address?.latitude ?? null;
      const businessLng = business.address?.longitude ?? null;
      if (businessLat == null || businessLng == null) {
        return { ...business, distanceMeters: undefined };
      }
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

async function fetchNearbyBusinesses(
  lat: number | null,
  lng: number | null,
): Promise<NearbyBusiness[]> {
  if (lat == null || lng == null) {
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

  const spatialResults = await spatialSearchService.searchByRadius({
    center: { latitude: lat, longitude: lng },
    radiusKm: TOURIST_POINT_NEARBY_LIMITS.MAX_RADIUS_KM,
    entityType: 'business',
    limit: NEARBY_SPATIAL_CANDIDATE_LIMIT,
  });

  if (spatialResults.length === 0) return [];

  const summaries = await BusinessService.getBusinessesByIds(
    spatialResults.map((result) => result.id),
  );
  const summaryById = new Map(summaries.map((business) => [business.id, business]));
  const allowedCategories = new Set<string>(TOURIST_POINT_NEARBY_BUSINESS_CATEGORIES);

  const selectedSpatial = spatialResults
    .filter((result) => {
      const summary = summaryById.get(result.id);
      return Boolean(summary && allowedCategories.has(summary.category));
    })
    .slice(0, TOURIST_POINT_NEARBY_LIMITS.MAX_RESULTS);

  const businesses = await Promise.all(
    selectedSpatial.map((result) => BusinessService.getBusinessById(result.id)),
  );
  const distanceById = new Map(
    selectedSpatial.map((result) => [result.id, result.distance_meters]),
  );

  return businesses.flatMap((business) => {
    if (!business) return [];
    return [{
      ...business,
      distanceMeters: distanceById.get(business.id),
    }];
  });
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
