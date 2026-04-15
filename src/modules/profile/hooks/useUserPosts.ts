import { useInfiniteQuery } from "@tanstack/react-query";
import { PostsFacade } from "@/core/posts/services"; // ✅ SSOT v2.0
import type { ServiceProfilePostRow } from "@/modules/profile/types/profileFeed";
import {
  normalizeProfileFeedPostType,
  toProfileFeedPost,
  type ProfileFeedPost,
  type ProfileFeedPostType,
} from "@/modules/profile/types/profileFeed";

interface UseUserPostsOptions {
  profileId: string;
  filters?: {
    type?: ProfileFeedPostType;
    sortBy?: "recent" | "popular";
  };
}

interface PaginatedUserPostsResult {
  posts: ProfileFeedPost[];
  nextPage?: number;
}

const POSTS_PER_PAGE = 20;

function sortPosts(
  posts: ProfileFeedPost[],
  sortBy: "recent" | "popular",
): ProfileFeedPost[] {
  const sortedPosts = [...posts];

  if (sortBy === "popular") {
    return sortedPosts.sort(
      (first, second) =>
        second.likes_count + second.comments_count -
        (first.likes_count + first.comments_count),
    );
  }

  return sortedPosts.sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime(),
  );
}

export function useUserPosts({
  profileId,
  filters,
}: UseUserPostsOptions) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery<PaginatedUserPostsResult>({
    queryKey: ["profile-posts", profileId, filters],
    enabled: Boolean(profileId),
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedUserPostsResult> => {
      const currentPage = typeof pageParam === "number" ? pageParam : 0;
      const postRows = (await PostsFacade.queries.getPostsByProfile(profileId, {
        limit: POSTS_PER_PAGE,
        offset: currentPage * POSTS_PER_PAGE,
      })) as ServiceProfilePostRow[];

      const normalizedPosts = postRows.map((post) => toProfileFeedPost(post));
      const filteredPosts = filters?.type
        ? normalizedPosts.filter(
            (post) => normalizeProfileFeedPostType(post.type) === filters.type,
          )
        : normalizedPosts;
      const sortedPosts = sortPosts(filteredPosts, filters?.sortBy ?? "recent");

      return {
        posts: sortedPosts,
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
