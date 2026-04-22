/**
 * Hook para ordenação e filtragem de negócios gastronômicos
 * 
 * Centraliza lógica de sorting, distância e paginação
 */

import { useMemo } from 'react';
import { calculateDistance } from '@/shared/utils/geolocation';
import type { GastronomyBusiness } from '../types';
import { DISTANCE_FALLBACK } from '../constants/landing';

export type BusinessSortKey = 'relevance' | 'nearest' | 'rating' | 'delivery_time' | 'delivery_fee';

interface UseGastronomyBusinessSortOptions {
  businesses: GastronomyBusiness[];
  sortBy: BusinessSortKey;
  distanceReferenceCoords: { latitude: number; longitude: number } | null;
}

/**
 * Calcula distância em metros entre coordenadas de referência e um negócio
 */
function getBusinessDistance(
  referenceCoords: { latitude: number; longitude: number } | null,
  businessLatitude?: number,
  businessLongitude?: number,
): number | null {
  if (
    !referenceCoords ||
    typeof businessLatitude !== 'number' ||
    typeof businessLongitude !== 'number' ||
    !Number.isFinite(businessLatitude) ||
    !Number.isFinite(businessLongitude)
  ) {
    return null;
  }

  return calculateDistance(
    referenceCoords.latitude,
    referenceCoords.longitude,
    businessLatitude,
    businessLongitude,
  );
}

export function useGastronomyBusinessSort(options: UseGastronomyBusinessSortOptions) {
  const { businesses, sortBy, distanceReferenceCoords } = options;

  // Mapa de distâncias por business_data_id
  const businessDistanceMap = useMemo(() => {
    const distances = new Map<string, number>();

    businesses.forEach((business) => {
      const distance = getBusinessDistance(
        distanceReferenceCoords,
        business.address?.latitude,
        business.address?.longitude,
      );

      if (distance !== null) {
        distances.set(business.business_data_id, distance);
      }
    });

    return distances;
  }, [businesses, distanceReferenceCoords]);

  // Negócios ordenados
  const sortedBusinesses = useMemo(() => {
    const items = [...businesses];

    switch (sortBy) {
      case 'nearest':
        items.sort((left, right) => {
          const leftDistance =
            businessDistanceMap.get(left.business_data_id) ?? DISTANCE_FALLBACK;
          const rightDistance =
            businessDistanceMap.get(right.business_data_id) ?? DISTANCE_FALLBACK;

          if (leftDistance !== rightDistance) {
            return leftDistance - rightDistance;
          }

          return right.rating - left.rating;
        });
        break;

      case 'rating':
        items.sort((left, right) => right.rating - left.rating);
        break;

      case 'delivery_time':
        items.sort(
          (left, right) =>
            (left.gastronomy_profile.delivery_time_min ?? 999) -
            (right.gastronomy_profile.delivery_time_min ?? 999),
        );
        break;

      case 'delivery_fee':
        items.sort(
          (left, right) =>
            (left.gastronomy_profile.delivery_fee ?? 999) -
            (right.gastronomy_profile.delivery_fee ?? 999),
        );
        break;

      case 'relevance':
      default:
        items.sort((left, right) => {
          if (left.is_premium && !right.is_premium) return -1;
          if (!left.is_premium && right.is_premium) return 1;
          return right.rating - left.rating;
        });
        break;
    }

    return items;
  }, [businesses, businessDistanceMap, sortBy]);

  // Distância mínima na seleção atual
  const nearestDistance = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    for (const distance of businessDistanceMap.values()) {
      if (distance < min) {
        min = distance;
      }
    }
    return min === Number.POSITIVE_INFINITY ? null : min;
  }, [businessDistanceMap]);

  return {
    sortedBusinesses,
    businessDistanceMap,
    nearestDistance,
    hasDistanceData: businessDistanceMap.size > 0,
  };
}
