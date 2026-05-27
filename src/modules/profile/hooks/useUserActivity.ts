import { useInfiniteQuery } from "@tanstack/react-query";
import { CommentService } from "@/core/comments/services";
import { postService } from "@/core/posts/services";
import { profileService } from "@/core/profiles/services";
import type {
  ProfileLikeActivityRecord,
  ProfilePollVoteActivityRecord,
  ProfileSaveActivityRecord,
} from "@/core/profiles/views/ProfileActivityRecords";
import type {
  ActivityFilters,
  ActivityItem,
  CommentCreatedMetadata,
  PollVotedMetadata,
  PostSavedMetadata,
  PostLikedMetadata,
} from "@/shared/types/activity";

type PostCreatedActivityRecord = Awaited<
  ReturnType<typeof postService.getPostActivityByAuthor>
>[number];

type CommentActivityRecord = Awaited<
  ReturnType<typeof CommentService.getCommentsByAuthor>
>[number];

interface UseUserActivityOptions {
  userId: string;
  profileId: string;
  filters?: ActivityFilters;
  pageSize?: number;
}

interface PaginatedActivityResult {
  activities: ActivityItem[];
  nextPage?: number;
}

function mapPostCreatedActivity(activity: PostCreatedActivityRecord): ActivityItem {
  const metadata = activity.metadata;

  return {
    id: activity.id,
    type: activity.type,
    created_at: activity.created_at,
    metadata,
  };
}

function mapCommentActivity(comment: CommentActivityRecord): ActivityItem {
  const metadata: CommentCreatedMetadata = {
    comment_id: comment.id,
    post_id: comment.post_id,
    post_type: "",
    comment_content: comment.content ?? "",
    likes_count: comment.likes_count ?? 0,
  };

  return {
    id: `comment_${comment.id}`,
    type: "comment_created",
    created_at: comment.created_at,
    metadata,
  };
}

function mapLikeActivity(like: ProfileLikeActivityRecord): ActivityItem {
  const metadata: PostLikedMetadata = {
    post_id: like.post?.id ?? "",
    post_type: like.post?.type ?? "",
    post_content: like.post?.content ?? "",
    author_profile_id: like.post?.author?.id ?? "",
    author_name: like.post?.author?.name ?? "Perfil",
    author_avatar: like.post?.author?.avatar_url ?? "",
  };

  return {
    id: `like_${like.id}`,
    type: "post_liked",
    created_at: like.created_at,
    metadata,
  };
}

function mapSavedActivity(save: ProfileSaveActivityRecord): ActivityItem {
  const metadata: PostSavedMetadata = {
    post_id: save.post?.id ?? "",
    post_type: save.post?.type ?? "",
    post_content: save.post?.content ?? "",
    author_profile_id: save.post?.author?.id ?? "",
    author_name: save.post?.author?.name ?? "Perfil",
    author_avatar: save.post?.author?.avatar_url ?? "",
  };

  return {
    id: `save_${save.id}`,
    type: "post_saved",
    created_at: save.created_at,
    metadata,
  };
}

function mapPollVoteActivity(vote: ProfilePollVoteActivityRecord): ActivityItem {
  const selectedOption = vote.poll?.options?.find(
    (option) => option.id === vote.option_id,
  );
  const metadata: PollVotedMetadata = {
    poll_id: vote.poll?.id ?? "",
    post_id: vote.poll?.post_id ?? "",
    question: vote.poll?.question ?? "",
    option_text: selectedOption?.text ?? "Opcao removida",
  };

  return {
    id: `vote_${vote.id}`,
    type: "poll_voted",
    created_at: vote.created_at,
    metadata,
  };
}

export function useUserActivity({
  userId,
  profileId,
  filters = {},
  pageSize = 20,
}: UseUserActivityOptions) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedActivityResult>({
    queryKey: ["user-activity", userId, profileId, filters, pageSize],
    enabled: Boolean(userId && profileId),
    queryFn: async ({ pageParam = 0 }): Promise<PaginatedActivityResult> => {
      const activities: ActivityItem[] = [];
      const currentPage = typeof pageParam === "number" ? pageParam : 0;
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      if (!filters.types || filters.types.includes("post_created")) {
        const postActivities = await postService.getPostActivityByAuthor(
          profileId,
          from,
          to,
        );
        activities.push(...postActivities.map(mapPostCreatedActivity));
      }

      if (!filters.types || filters.types.includes("comment_created")) {
        const commentData = await CommentService.getCommentsByAuthor(profileId, {
          limit: pageSize,
          offset: from,
        });

        activities.push(...commentData.map(mapCommentActivity));
      }

      if (!filters.types || filters.types.includes("post_liked")) {
        const likes = await profileService.getUserLikeActivity(userId, from, to);
        activities.push(...likes.map(mapLikeActivity));
      }

      if (!filters.types || filters.types.includes("post_saved")) {
        const saved = await profileService.getUserSaveActivity(userId, from, to);
        activities.push(...saved.map(mapSavedActivity));
      }

      if (!filters.types || filters.types.includes("poll_voted")) {
        const votes = await profileService.getUserPollVoteActivity(userId, from, to);
        activities.push(...votes.map(mapPollVoteActivity));
      }

      activities.sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime(),
      );

      let filteredActivities = activities;
      if (filters.dateFrom) {
        filteredActivities = filteredActivities.filter(
          (activity) => new Date(activity.created_at) >= filters.dateFrom!,
        );
      }
      if (filters.dateTo) {
        filteredActivities = filteredActivities.filter(
          (activity) => new Date(activity.created_at) <= filters.dateTo!,
        );
      }

      const paginatedActivities = filteredActivities.slice(0, pageSize);

      return {
        activities: paginatedActivities,
        nextPage:
          paginatedActivities.length === pageSize ? currentPage + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const activities = data?.pages.flatMap((page) => page.activities) ?? [];

  return {
    activities,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore: fetchNextPage,
  };
}
