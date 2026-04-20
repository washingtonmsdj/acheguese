import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { CommunityPost } from "../types";
import { postService } from "@/core/posts/services";

export function usePostById(postId: string | null) {
  return useQuery({
    queryKey: ["community-post", postId],
    queryFn: async () => {
      if (!postId) return null;

      // ✅ FASE 2: Usar ProfileService.getActiveProfile() para contexto social (opcional)
      const activeProfile = await profileService.getActiveProfile();

      const post = await postService.getCommunityPostById(postId);
      if (!post) return null;

      const authorProfile = await profileService.getProfilesSummary([
        (post as any).author_profile_id,
      ]);
      const profile = authorProfile[0];

      // ✅ SSOT — interações via PostService
      const interactions = activeProfile
        ? await postService.getPostUserInteractions(
            postId,
            activeProfile.userId,
            (post as any).type,
          )
        : {
            isLiked: false,
            isSaved: false,
            hasConfirmed: false,
            pollVoteOptionId: null,
          };

      // Buscar poll se existir
      const pollData = await postService.getPollByPostId(post.id);
      let enrichedPoll: any = pollData;
      if (pollData && interactions.pollVoteOptionId) {
        enrichedPoll = {
          ...pollData,
          user_voted: true,
          user_vote_option_id: interactions.pollVoteOptionId,
        };
      } else if (pollData) {
        enrichedPoll = {
          ...pollData,
          user_voted: false,
          user_vote_option_id: undefined,
        };
      }

      // ✅ SSOT — menções via PostService
      const mentionedProfiles = await postService.getPostMentions(post.id);

      return {
        id: post.id,
        author_profile_id: (post as any).author_profile_id,
        author_name: profile?.name || "Usuário",
        author_avatar:
          (profile as any)?.avatarUrl || (profile as any)?.avatar_url,
        author_reputation: (profile as any)?.reputation || 0,
        is_verified_resident: profile?.verified || false,
        type: (post as any).type,
        content: (post as any).content,
        images: (post as any).images || [],
        tags: (post as any).tags || [],
        location_id: (post as any).location_id,
        location: (post as any).location,
        created_at: (post as any).created_at,
        likes_count: (post as any).likes_count,
        comments_count: (post as any).comments_count,
        confirmations_count: (post as any).confirmations_count || 0,
        is_verified: profile?.verified || false,
        is_liked: interactions.isLiked,
        is_saved: interactions.isSaved,
        has_user_confirmed: interactions.hasConfirmed,
        is_edited: (post as any).is_edited || false,
        poll: enrichedPoll,
        mentioned_profiles: mentionedProfiles,
      } as CommunityPost;
    },
    enabled: !!postId,
  });
}
