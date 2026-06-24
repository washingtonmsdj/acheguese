import { useQuery } from "@tanstack/react-query";
import { TrendingTopic } from "@/shared/types/community";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import { postService } from "@/core/posts/services";
import type { TerritoryFilter } from "@/core/location/types";

function resolveTrendingLocationIds(
  territoryFilter: TerritoryFilter | undefined,
  fallbackLocationId: string | null | undefined,
): string[] {
  if (territoryFilter?.scope === "location") return [territoryFilter.location_id];
  if (territoryFilter?.scope === "group") return territoryFilter.location_ids;
  return fallbackLocationId ? [fallbackLocationId] : [];
}

/**
 * Hook para tendencias do bairro do usuario.
 * Usa location_id canonico (UUID) como chave de cache.
 */
export function useTrendingTopics(limit: number = 3, territoryFilter?: TerritoryFilter) {
  const { homeDistrict, hasHome } = useUserTerritory();
  const locationIds = resolveTrendingLocationIds(territoryFilter, homeDistrict?.id);
  const effectiveKey = territoryFilter
    ? territoryFilterKey(territoryFilter)
    : homeDistrict?.id ?? "none";

  return useQuery({
    queryKey: ["trending-topics", effectiveKey, limit],
    queryFn: async (): Promise<TrendingTopic[]> => {
      if (locationIds.length === 0) return [];

      const topPosts = (
        await Promise.all(locationIds.map((locationId) => postService.getTopPosts(locationId, 30)))
      ).flat();

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
    enabled: locationIds.length > 0 && (Boolean(territoryFilter) || hasHome),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
