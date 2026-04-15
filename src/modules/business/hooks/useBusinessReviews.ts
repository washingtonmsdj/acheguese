/**
 * GATE 3 - FASE 3B: Hook para reviews de empresas
 * Migrado para usar ReviewsService e novo modelo de identidade
 */

import { useQuery } from "@tanstack/react-query";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import type { ReviewWithProfiles } from "@/shared/types/reviews";

interface UseBusinessReviewsReturn {
  reviews: ReviewWithProfiles[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBusinessReviews(
  businessId: string | undefined,
): UseBusinessReviewsReturn {
  const query = useQuery({
    queryKey: ["business", "reviews", businessId || ""],
    queryFn: async () => {
      if (!businessId) return [];
      return await ReviewsService.getReviewsForProfile(businessId, "business");
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  return {
    reviews: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
