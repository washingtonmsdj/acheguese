import { useInfiniteQuery } from "@tanstack/react-query";
import { moderationQueueService } from "@/core/moderation/services/ModerationQueueService";
import type { ModerationFilters } from "@/core/moderation/types";

interface UsePendingCommentsOptions {
  filters?: ModerationFilters;
  pageSize?: number;
}

export function usePendingComments({
  filters = {},
  pageSize = 10,
}: UsePendingCommentsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: ["pending-comments", filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = Number(pageParam) || 0;
      const page = await moderationQueueService.listPendingComments({
        filters,
        offset,
        pageSize,
      });

      return {
        comments: page.items,
        nextPage: page.nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const comments = query.data?.pages.flatMap((page) => page.comments) || [];

  return {
    comments,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}
