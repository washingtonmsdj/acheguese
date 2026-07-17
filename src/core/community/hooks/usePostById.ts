import { useQuery } from "@tanstack/react-query";

import { profileService } from "@/core/profiles/services/ProfileService";
import { postService } from "@/core/posts/services";
import type { CommunityPost } from "@/core/posts/types/Post";

interface CommunityPostRecord {
  id: string;
  author_profile_id: string;
  type: string;
  content: string;
  images?: string[];
  tags?: string[];
  location_id?: string;
  location?: CommunityPost["location"];
  created_at: string;
  likes_count: number;
  comments_count: number;
  confirmations_count?: number;
  is_edited?: boolean;
}

interface CommunityPostInteractions {
  isLiked: boolean;
  isSaved: boolean;
  hasConfirmed: boolean;
  pollVoteOptionId: string | null;
}

export function usePostById(postId: string | null) {
  return useQuery({
    queryKey: ["community-post", postId],
    queryFn: async () => {
      if (!postId) return null;

      const activeProfile = await profileService.getActiveProfile();
      const post = (await postService.getPostById(
        postId,
      )) as CommunityPostRecord | null;

      if (!post) return null;

      const authorProfiles = await profileService.getProfilesSummary([
        post.author_profile_id,
      ]);
      const authorProfile = authorProfiles[0];

      const interactions: CommunityPostInteractions = activeProfile
        ? await postService.getPostUserInteractions(
            postId,
            activeProfile.user_id,
            post.type,
          )
        : {
            isLiked: false,
            isSaved: false,
            hasConfirmed: false,
            pollVoteOptionId: null,
          };

      const pollData = await postService.getPollByPostId(post.id);
      const enrichedPoll: CommunityPost["poll"] = pollData
        ? {
            ...pollData,
            user_voted: Boolean(interactions.pollVoteOptionId),
            user_vote_option_id: interactions.pollVoteOptionId ?? undefined,
          }
        : undefined;

      const communityPost: CommunityPost = {
        id: post.id,
        author_profile_id: post.author_profile_id,
        author_name: authorProfile?.displayName || "Usuario",
        author_avatar: authorProfile?.avatarUrl,
        author_reputation: 0,
        is_verified_resident: authorProfile?.verified || false,
        type: post.type,
        content: post.content,
        images: post.images || [],
        tags: post.tags || [],
        location_id: post.location_id,
        location: post.location,
        created_at: post.created_at,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        confirmations_count: post.confirmations_count || 0,
        is_verified: authorProfile?.verified || false,
        is_liked: interactions.isLiked,
        is_saved: interactions.isSaved,
        has_user_confirmed: interactions.hasConfirmed,
        is_edited: post.is_edited || false,
        poll: enrichedPoll,
      };

      return communityPost;
    },
    enabled: !!postId,
  });
}
