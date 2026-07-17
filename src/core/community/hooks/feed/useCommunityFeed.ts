/**
 * Hook para feed da comunidade usando PostService.getFeed()
 *
 * ✅ SSOT — Usa PostService como fonte única
 * ✅ Infinite scroll com cursor pagination
 * ✅ Integração com filtros de localização
 * ✅ Geographic Foundation — Integrado com fundação geográfica
 * ✅ Etapa 5 — Suporte a TerritoryFilter (location e group)
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { isTerritoryFilterReady, territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { Post, FeedParams } from "@/core/posts/types";
import type { LocationScope } from "@/core/community/hooks/feed/useFeedFilters";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location/types";
import { communityFeedQueryKeys } from "@/core/feed";

interface UseCommunityFeedOptions {
  locationScope?: LocationScope;
  limit?: number;
  enabled?: boolean;
  /** Território resolvido pela rota — passar quando dentro de TerritorialLayout */
  routeResolved?: ResolvedTerritory | null;
  /** Filtro territorial canônico resolvido pela página */
  territoryFilter?: TerritoryFilter;
}

export function useCommunityFeedSimple(options: UseCommunityFeedOptions = {}) {
  const { locationScope = "city", limit = 20, routeResolved, territoryFilter } = options;

  const moduleTerritory = useModuleTerritoryFilter({ routeResolved });
  const filter = territoryFilter ?? moduleTerritory.territoryFilter;
  const filterReady = isTerritoryFilterReady(filter);
  const filterKey = territoryFilterKey(filter);
  const queryEnabled = filterReady && options.enabled !== false;

  const query = useInfiniteQuery({
    queryKey: communityFeedQueryKeys.list(locationScope, filterKey),
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params: FeedParams = {
        cursor: pageParam,
        limit,
      };

      // Filtro territorial canônico — location ou group
      if (filter.scope === 'location') {
        params.location_id = filter.location_id;
        params.district_filter = true;
      } else if (filter.scope === 'group') {
        params.location_ids = filter.location_ids;
      }
      // scope === 'none': sem território resolvido — query não executa (enabled: filterReady)

      return postService.getFeed(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: queryEnabled, // Só executa se há território resolvido e a superfície pediu dados reais
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Flatten all pages into a single list of posts
  const posts: Post[] = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    data: posts,
    posts,
    isLoading: query.isLoading,
    loading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
    refetch: query.refetch,
  };
}
