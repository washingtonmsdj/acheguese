import { useQuery } from "@tanstack/react-query";
import { commentService } from "@/core/comments/services";
import { postService } from "@/core/posts/services";
import { profileService } from "@/core/profiles/services";
import type { ActivityStats } from "@/shared/types/activity";

interface UseActivityStatsOptions {
  userId: string;
  profileId: string;
}

export function useActivityStats({
  userId,
  profileId,
}: UseActivityStatsOptions) {
  return useQuery({
    queryKey: ["activity-stats", userId, profileId],
    enabled: Boolean(userId && profileId),
    queryFn: async (): Promise<ActivityStats> => {
      const [postsCount, likesReceivedCount, commentsCount, stats] =
        await Promise.all([
          postService.getPostsCountByAuthor(profileId),
          postService.getPostsLikesReceivedByAuthor(profileId),
          commentService.getCommentCountByAuthor(profileId),
          profileService.getStats(userId),
        ]);

      return {
        total_posts: postsCount ?? 0,
        total_comments: commentsCount ?? 0,
        total_likes_given: stats?.likes ?? 0,
        total_likes_received: likesReceivedCount ?? 0,
        total_saves: 0,
        total_poll_votes: 0,
        total_alert_confirmations: 0,
        total_mentions: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
