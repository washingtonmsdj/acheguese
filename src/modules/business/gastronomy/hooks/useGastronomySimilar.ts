/**
 * useGastronomySimilar - Restaurantes similares (mesma cuisine_type)
 */

import { useQuery } from "@tanstack/react-query";
import { isValidUUID } from "@/shared/utils/validation";
import {
  fetchSimilarGastronomyBusinesses,
  type SimilarGastronomyBusiness,
} from "@/modules/business/gastronomy/services/gastronomy-runtime.queries";

export type { SimilarGastronomyBusiness };

export function useGastronomySimilar(params: {
  businessDataId: string;
  cuisineType: string;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["gastronomy", "similar", params.businessDataId, params.cuisineType],
    queryFn: () => fetchSimilarGastronomyBusinesses(params),
    enabled: params.enabled !== false && isValidUUID(params.businessDataId) && !!params.cuisineType,
    staleTime: 10 * 60 * 1000,
  });
}

