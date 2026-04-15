/**
 * ✅ SSOT - Hook useUserMentions migrado
 * Usa ProfileService.getUserMentions() como fonte única
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { profileService } from "@/core/profiles/services";

interface MentionPost {
  id: string;
  type: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author: {
    id: string;
    name: string;
    avatar_url: string;
  };
  rank?: number;
}

interface UseUserMentionsOptions {
  userId: string;
  pageSize?: number;
}

export function useUserMentions({
  userId,
  pageSize = 10,
}: UseUserMentionsOptions) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["user-mentions", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;

      // ✅ SSOT - Usa ProfileService
      const mentions = await profileService.getUserMentions(userId, from, to);

      return {
        mentions,
        nextPage: mentions.length === pageSize ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const mentions = data?.pages.flatMap((page) => page.mentions) || [];

  return {
    mentions,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
  };
}
