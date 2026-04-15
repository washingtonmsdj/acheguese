import { useInfiniteQuery } from "@tanstack/react-query";
import { PendingComment, ModerationFilters } from "@/core/moderation/types";

interface UsePendingCommentsOptions {
  filters?: ModerationFilters;
  pageSize?: number;
}

export function usePendingComments({
  filters = {},
  pageSize = 10,
}: UsePendingCommentsOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: ["pending-comments", filters],
    queryFn: async ({ pageParam = 0 }) => {
      // TEMPORÁRIO: Retornar array vazio até community_reports estar funcionando
      // Evita erros 404 no console
      return {
        comments: [],
        nextPage: undefined,
        totalCount: 0,
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
