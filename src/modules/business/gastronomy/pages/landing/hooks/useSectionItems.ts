/**
 * Hook para calcular items das seções (food e business)
 */

import { useMemo } from 'react';
import type { GastronomyBusiness, PublicGastronomyFoodItem } from '../../../types';
import type { BusinessSectionItems, FoodSectionItems } from '../types';
import {
  DISTANCE_FALLBACK,
  PRODUCT_SECTION_ITEMS_LIMIT,
  SECTION_ITEMS_LIMIT,
} from '../constants';

interface UseFoodSectionItemsParams {
  foodCatalog: PublicGastronomyFoodItem[];
}

export function useFoodSectionItems(params: UseFoodSectionItemsParams): FoodSectionItems {
  const { foodCatalog } = params;

  return useMemo(() => {
    const mostOrdered = [...foodCatalog]
      .sort((left, right) => right.orders_count - left.orders_count)
      .slice(0, PRODUCT_SECTION_ITEMS_LIMIT);

    const topRated = [...foodCatalog]
      .sort((left, right) => {
        if (right.business_rating !== left.business_rating) {
          return right.business_rating - left.business_rating;
        }
        return right.orders_count - left.orders_count;
      })
      .slice(0, PRODUCT_SECTION_ITEMS_LIMIT);

    return {
      mostOrdered,
      topRated,
    };
  }, [foodCatalog]);
}

interface UseBusinessSectionItemsParams {
  businesses: GastronomyBusiness[];
  distanceMap: Map<string, number>;
}

export function useBusinessSectionItems(
  params: UseBusinessSectionItemsParams,
): BusinessSectionItems {
  const { businesses, distanceMap } = params;

  return useMemo(() => {
    const nearest = [...businesses]
      .map((business) => ({
        business,
        distance: distanceMap.get(business.business_data_id) ?? DISTANCE_FALLBACK,
      }))
      .filter((entry) => Number.isFinite(entry.distance))
      .sort((left, right) => left.distance - right.distance)
      .map((entry) => entry.business)
      .slice(0, SECTION_ITEMS_LIMIT);

    const topRated = [...businesses]
      .sort((left, right) => right.rating - left.rating)
      .slice(0, SECTION_ITEMS_LIMIT);

    const featured = businesses
      .filter((business) => business.is_premium || business.rating >= 4.5)
      .slice(0, SECTION_ITEMS_LIMIT);

    return {
      nearest,
      topRated,
      featured,
    };
  }, [businesses, distanceMap]);
}
