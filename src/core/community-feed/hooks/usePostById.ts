import { useQuery } from "@tanstack/react-query";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
} from "@/core/location/hooks/useTerritoryFilter";
import type { TerritoryFilter } from "@/core/location/types";

import { profileService } from "@/core/profiles/services/ProfileService";
import { postService } from "@/core/posts/services";
import type { CommunityPostView } from "@/core/posts/views/CommunityPostView";

interface CommunityPostRecord {
  id: string;
  author_profile_id: string;
  type: CommunityPostView["type"];
  content: string;
  images?: string[];
  tags?: string[];
  location_id?: string;
  location?: CommunityPostView["location"];
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
}

export function usePostById(
  postId: string | null,
  territoryFilter: TerritoryFilter,
) {
  return useQuery({
    queryKey: ["community-post", territoryFilterKey(territoryFilter), postId],
    queryFn: async (): Promise<CommunityPostView | null> => {
      if (!postId || !isTerritoryFilterReady(territoryFilter)) return null;

      const activeProfile = await profileService.getActiveProfile();
      const post = (await postService.getPublicPostById(
        postId,
        territoryFilter,
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
          };

      const pollData = await postService.getPollByPostId(post.id);
      const enrichedPoll: CommunityPostView["poll"] = pollData
        ? {
            ...pollData,
            user_voted: pollData.user_voted,
            user_vote_option_id: pollData.user_vote_option_id,
          }
        : undefined;

      return {
        id: post.id,
        author_profile_id: post.author_profile_id,
        author_name: authorProfile?.displayName || "Usuario",
        author_avatar: authorProfile?.avatarUrl,
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
    },
    enabled: Boolean(postId) && isTerritoryFilterReady(territoryFilter),
  });
}
