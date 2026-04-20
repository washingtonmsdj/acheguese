/**
 * Hook para feed da comunidade usando PostService.getFeed()
 *
 * âœ… SSOT â€” Usa PostService como fonte Ãºnica
 * âœ… Infinite scroll com cursor pagination
 * âœ… IntegraÃ§Ã£o com filtros de localizaÃ§Ã£o
 * âœ… Geographic Foundation â€” Integrado com fundaÃ§Ã£o geogrÃ¡fica
 * âœ… Etapa 5 â€” Suporte a TerritoryFilter (location e group)
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services";
import { useTerritoryFilter, isTerritoryFilterReady, territoryFilterKey } from "@/core/location";
import type { Post, FeedParams } from "@/core/posts/types";
import type { LocationScope } from "@/core/community/hooks/feed/useFeedFilters";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface UseCommunityFeedOptions {
  locationScope?: LocationScope;
  context?: "all" | "my_posts" | "saved";
  limit?: number;
  /** TerritÃ³rio resolvido pela rota â€” passar quando dentro de TerritorialLayout */
  routeResolved?: ResolvedTerritory | null;
}

export function useCommunityFeedSimple(options: UseCommunityFeedOptions = {}) {
  const { locationScope = "city", context = "all", limit = 20, routeResolved } = options;

  // Filtro territorial canÃ´nico â€” suporta location e group
  const filter = useTerritoryFilter(routeResolved);
  const filterReady = isTerritoryFilterReady(filter);
  const filterKey = territoryFilterKey(filter);

  const query = useInfiniteQuery({
    queryKey: [
      "community-feed",
      locationScope,
      context,
      filterKey,
    ],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params: FeedParams = {
        context,
        cursor: pageParam,
        limit,
      };

      // Filtro territorial canÃ´nico â€” location ou group
      if (filter.scope === 'location') {
        params.location_id = filter.location_id;
        params.district_filter = true;
      } else if (filter.scope === 'group') {
        params.location_ids = filter.location_ids;
      }
      // scope === 'none': sem territÃ³rio resolvido â€” query nÃ£o executa (enabled: filterReady)

      return postService.getFeed(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: filterReady, // SÃ³ executa se hÃ¡ territÃ³rio resolvido
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Flatten all pages into a single list of posts
  const posts: Post[] = query.data?.pages.flatMap((page) => page.posts) ?? [];

  // Convert to feed items format for backward compatibility
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

