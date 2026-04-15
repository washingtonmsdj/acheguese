import { useInfiniteQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services";
import { SocialInteractionsService } from "@/core/social";
import type { ServiceProfilePostRow } from "@/modules/profile/types/profileFeed";
import {
  toProfileFeedPost,
  type ProfileFeedPost,
} from "@/modules/profile/types/profileFeed";

interface UseSavedPostsOptions {
  userId: string;
}

interface PaginatedSavedPostsResult {
  posts: ProfileFeedPost[];
  nextPage?: number;
}

const POSTS_PER_PAGE = 20;

export function useSavedPosts({ userId }: UseSavedPostsOptions) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery<PaginatedSavedPostsResult>({
    queryKey: ["saved-posts", userId],
    enabled: Boolean(userId),
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedSavedPostsResult> => {
      const currentPage = typeof pageParam === "number" ? pageParam : 0;
      const postRows = (await postService.getSavedPosts(userId, {
        limit: POSTS_PER_PAGE,
        offset: currentPage * POSTS_PER_PAGE,
      })) as ServiceProfilePostRow[];
      const postIds = postRows.map((post) => post.id);
      const userLikes =
        postIds.length > 0
          ? await SocialInteractionsService.getLikesForPosts(postIds, userId)
          : new Set<string>();
      const posts = postRows.map((post) =>
        toProfileFeedPost(post, {
          isLiked: userLikes.has(post.id),
          isSaved: true,
        }),
      );

      return {
        posts,
        nextPage: postRows.length === POSTS_PER_PAGE ? currentPage + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return {
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
  };
}
