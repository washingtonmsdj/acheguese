import { useQuery } from "@tanstack/react-query";
import { getReviewStats } from "@/core/reviews/services";

interface SellerReputation {
  averageRating: number;
  totalReviews: number;
}

function normalizeReviewStats(raw: unknown): SellerReputation {
  const source = (raw ?? {}) as Record<string, unknown>;

  const averageCandidate =
    source.average ??
    source.average_rating ??
    source.avg_rating ??
    0;
  const totalCandidate =
    source.total ??
    source.total_reviews ??
    source.reviews_count ??
    0;

  const averageRating = Number.isFinite(Number(averageCandidate))
    ? Number(averageCandidate)
    : 0;
  const totalReviews = Number.isFinite(Number(totalCandidate))
    ? Number(totalCandidate)
    : 0;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: Math.max(0, totalReviews),
  };
}

export function useSellerReputation(profileId?: string) {
  return useQuery({
    queryKey: ["seller-reputation", profileId],
    queryFn: async () => {
      const stats = await getReviewStats(profileId!, "business");
      return normalizeReviewStats(stats);
    },
    enabled: Boolean(profileId),
    staleTime: 1000 * 60 * 5,
  });
}

