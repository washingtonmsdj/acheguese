import { useInfiniteQuery } from "@tanstack/react-query";
import { communityContentModerationService } from "../CommunityContentModerationService";
import type { ModerationFilters } from "../types";

interface UsePendingPostsOptions {
  filters?: ModerationFilters;
  pageSize?: number;
}

export function usePendingPosts({
  filters = {},
  pageSize = 10,
}: UsePendingPostsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: ["pending-posts", filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = Number(pageParam) || 0;
      const page = await communityContentModerationService.listPendingPosts({
        filters,
        offset,
        pageSize,
      });

      return {
        posts: page.items,
        nextPage: page.nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const posts = query.data?.pages.flatMap((page) => page.posts) || [];

  return {
    posts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}
