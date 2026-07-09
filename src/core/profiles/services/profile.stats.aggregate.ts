import { getFavoriteStats } from "@/core/favorites/services/favorites.queries";
import type { ProfileRow as Profile } from "./types";

type ProfileStatsDependencies = {
  userId: string;
  getActiveProfile: (userId: string) => Promise<Profile | null>;
  getUserLikesCount: (profileId: string) => Promise<number>;
};

export async function getProfileStatsAggregate(deps: ProfileStatsDependencies) {
  const activeProfile = await deps.getActiveProfile(deps.userId);

  if (!activeProfile) {
    return {
      posts: 0,
      likes: 0,
      favorites: 0,
    };
  }

  const { postService } = await import("@/core/posts/services");
  const [postsCount, likesCount, favoritesResult] = await Promise.all([
    postService.getPostsCountByUser(deps.userId),
    deps.getUserLikesCount(activeProfile.id),
    getFavoriteStats(activeProfile.id),
  ]);

  return {
    posts: postsCount || 0,
    likes: likesCount || 0,
    favorites: favoritesResult.total_favorites_given || 0,
  };
}
