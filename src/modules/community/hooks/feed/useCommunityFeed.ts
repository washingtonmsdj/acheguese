/**
 * Hook para feed da comunidade usando PostService.getFeed()
 *
 * SSOT - Usa PostService como fonte unica
 * Infinite scroll com cursor pagination
 * Integracao com filtros de localizacao
 * Geographic Foundation - Integrado com fundacao geografica
 * Etapa 5 - Suporte a TerritoryFilter (location e group)
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { isTerritoryFilterReady, territoryFilterKey } from "@/core/location/hooks/useTerritoryFilter";
import type { Post, FeedParams } from "@/core/posts/types";
import type { LocationScope } from "@/modules/community/hooks/feed/useFeedFilters";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location/types";

interface UseCommunityFeedOptions {
  locationScope?: LocationScope;
  context?: "all" | "my_posts" | "saved";
  limit?: number;
  routeResolved?: ResolvedTerritory | null;
  territoryFilter?: TerritoryFilter;
}

export function useCommunityFeedSimple(options: UseCommunityFeedOptions = {}) {
  const { locationScope = "city", context = "all", limit = 20, routeResolved, territoryFilter } = options;

  const moduleTerritory = useModuleTerritoryFilter({ routeResolved });
  const filter = territoryFilter ?? moduleTerritory.territoryFilter;
  const filterReady = isTerritoryFilterReady(filter);
  const filterKey = territoryFilterKey(filter);

  const query = useInfiniteQuery({
    queryKey: ["community-feed", locationScope, context, filterKey],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params: FeedParams = {
        context,
        cursor: pageParam,
        limit,
      };

      if (filter.scope === "location") {
        params.location_id = filter.location_id;
        params.district_filter = true;
      } else if (filter.scope === "group") {
        params.location_ids = filter.location_ids;
      }

      return postService.getFeed(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: filterReady,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const posts: Post[] = query.data?.pages.flatMap((page) => page.posts) ?? [];

  const feedItems = posts.map((post) => ({
    type: "post" as const,
    data: post,
    date: post,
  }));

  return {
    data: posts,
    posts,
    feedItems,
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
