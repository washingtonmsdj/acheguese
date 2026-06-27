import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { CommunityPost } from "@/core/posts/types/Post";
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

      const post = (await postService.getPostById(
        postId,
      )) as unknown as CommunityPostRecord | null;
      if (!post) return null;

      const authorProfile = await profileService.getProfilesSummary([post.author_profile_id]);
      const profile = authorProfile[0];

      // ✅ SSOT — interações via PostService
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

      // Buscar poll se existir
      const pollData = await postService.getPollByPostId(post.id);
      let enrichedPoll = pollData;
      if (pollData && interactions.pollVoteOptionId) {
        enrichedPoll = {
          ...pollData,
          user_voted: true,
          user_vote_option_id: interactions.pollVoteOptionId,
        } as any;
      } else if (pollData) {
        enrichedPoll = {
          ...pollData,
          user_voted: false,
          user_vote_option_id: undefined,
        } as any;
      }

      // ✅ SSOT — menções via PostService
      const mentionedProfiles = await postService.getPostMentions(post.id);

      return {
        id: post.id,
        author_profile_id: post.author_profile_id,
        author_name: profile?.displayName || "Usuário",
        author_avatar: profile?.avatarUrl,
        author_reputation: 0,
        is_verified_resident: profile?.verified || false,
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
