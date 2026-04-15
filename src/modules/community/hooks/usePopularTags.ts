import { useQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services";

interface PopularTag {
  tag: string;
  count: number;
}

interface UsePopularTagsOptions {
  locationId: string;
}

/**
 * Hook para tags populares — SSOT territorial
 * Usa location_id canônico, sem campos legados (city/neighborhood/street).
 */
export function usePopularTags({ locationId }: UsePopularTagsOptions) {
  return useQuery<PopularTag[]>({
    queryKey: ["popular-tags", locationId],
    queryFn: () => postService.getPopularTags(locationId, 10),
    staleTime: 5 * 60 * 1000,
    enabled: !!locationId,
  });
}
