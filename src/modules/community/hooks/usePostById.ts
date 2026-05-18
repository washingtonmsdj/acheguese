import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { CommunityPost } from "@/core/posts/types";
import { postService } from "@/core/posts/services";

interface CommunityPostRecord {
  id: string;
  author_profile_id: string;
  type: string;
  content: string;
  images?: string[];
  tags?: string[];
  location_id?: string;
  location?: string;
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

      // ✅ FASE 2: Usar ProfileService.getActiveProfile() para contexto social (opcional)
      const activeProfile = await profileService.getActiveProfile();

      const postApi = postService as unknown as {
        getCommunityPostById: (id: string) => Promise<CommunityPostRecord | null>;
        getPostUserInteractions: (postId: string, profileId: string, type: string) => Promise<CommunityPostInteractions>;
        getPollByPostId: (postId: string) => Promise<unknown>;
        getPostMentions: (postId: string) => Promise<unknown[]>;
      };
      const post = (await postApi.getCommunityPostById(
        postId,
      )) as CommunityPostRecord | null;
      if (!post) return null;

      const authorProfile = await profileService.getProfilesSummary([post.author_profile_id]);
      const profile = authorProfile[0];

      // ✅ SSOT — interações via PostService
      const interactions: CommunityPostInteractions = activeProfile
        ? await postApi.getPostUserInteractions(
            postId,
            activeProfile.id,
            post.type,
          )
        : {
            isLiked: false,
            isSaved: false,
            hasConfirmed: false,
            pollVoteOptionId: null,
          };

      // Buscar poll se existir
      const enrichedPoll = await postApi.getPollByPostId(post.id);

      // ✅ SSOT — menções via PostService
      const mentionedProfiles = await postApi.getPostMentions(post.id);

      return {
        id: post.id,
        author_profile_id: post.author_profile_id,
        author_name: profile?.name || "Usuário",
        author_avatar: profile?.avatarUrl,
        author_reputation: 0,
        is_verified_resident: profile?.verified || false,
        type: post.type,
        content: post.content,
        images: post.images || [],
        tags: post.tags || [],
        location_id: post.location_id,
        location: post.location_id ? { id: post.location_id, name: post.location ?? "Local" } : undefined,
        reach: "neighborhood",
        created_at: post.created_at,
        updated_at: post.created_at,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        confirmations_count: post.confirmations_count || 0,
        is_verified: profile?.verified || false,
        is_liked: interactions.isLiked,
        is_saved: interactions.isSaved,
        has_user_confirmed: interactions.hasConfirmed,
        is_edited: post.is_edited || false,
        poll: enrichedPoll,
        mentioned_profiles: mentionedProfiles,
      } as unknown as CommunityPost;
    },
    enabled: !!postId,
  });
}
