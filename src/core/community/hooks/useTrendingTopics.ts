import { useQuery } from "@tanstack/react-query";
import { TrendingTopic } from "@/shared/types/community";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { postService } from "@/core/posts/services";

/**
 * Hook para tendencias do bairro do usuario.
 * Usa location_id canonico (UUID) como chave de cache.
 */
export function useTrendingTopics(limit: number = 3) {
  const { homeDistrict, hasHome } = useUserTerritory();

  return useQuery({
    queryKey: ["trending-topics", homeDistrict?.id ?? null, limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      if (!homeDistrict?.id) return [];

      const topPosts = await postService.getTopPosts(homeDistrict.id, 30);

      const hashtagCounts = new Map<string, number>();
      for (const post of topPosts) {
        const content = post.content || "";
        const matches = content.match(/#[\p{L}\p{N}_-]+/gu) || [];
        for (const rawTag of matches) {
          const normalized = rawTag.toLowerCase();
          hashtagCounts.set(normalized, (hashtagCounts.get(normalized) || 0) + 1);
        }
      }

      return Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, mentions], index) => ({
          id: tag,
          title: tag,
          mentions,
          position: index + 1,
        }));
    },
    enabled: hasHome && !!homeDistrict?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
