import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type { SocialInteractionStats } from "@/core/social/types";

export async function getSocialInteractionStatsByProfile(
  profileId: string,
): Promise<SocialInteractionStats> {
  try {
    const [likesResult, savedResult, groupsResult] = await Promise.all([
      supabase
        .from("post_likes_new")
        .select("id", { count: "exact", head: true })
        .eq("liker_profile_id", profileId),

      supabase
        .from("saved_posts_new")
        .select("id", { count: "exact", head: true })
        .eq("saver_profile_id", profileId),

      supabase
        .from("group_members_new")
        .select("id", { count: "exact", head: true })
        .eq("member_profile_id", profileId),
    ]);

    return {
      likesGiven: likesResult.count || 0,
      postsSaved: savedResult.count || 0,
      groupsJoined: groupsResult.count || 0,
    };
  } catch (error) {
    trackError(error as Error, {
      component: "socialInteractionStats.queries",
      action: "getSocialInteractionStatsByProfile",
      metadata: { profileId },
    });
    return {
      likesGiven: 0,
      postsSaved: 0,
      groupsJoined: 0,
    };
  }
}
