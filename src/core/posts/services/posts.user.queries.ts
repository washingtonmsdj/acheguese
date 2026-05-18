/**
 * POSTS USER/INTERACTION QUERIES - SSOT
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import { profileService } from "@/core/profiles/services/ProfileService";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import type { PaginationParams, Post } from "../types";
import { PostError } from "../types";
import * as pollQueries from "./polls.queries";
export async function getPostUserInteractions(
  postId: string,
  userId: string,
): Promise<{
  isLiked: boolean;
  isSaved: boolean;
  hasConfirmed: boolean;
  pollVoteOptionId: string | null;
}> {
  try {
    const activeProfile = await profileService.getActiveProfile(userId);
    const profileId = activeProfile?.id;

    const [likeData, savedData] = await Promise.all([
      profileId
        ? supabase
            .from("post_likes_new")
            .select("id")
            .eq("post_id", postId)
            .eq("liker_profile_id", profileId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      profileId
        ? supabase
            .from("saved_posts_new")
            .select("id")
            .eq("post_id", postId)
            .eq("saver_profile_id", profileId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const hasConfirmed = false;

    let pollVoteOptionId: string | null = null;
    const poll = await pollQueries.getPollByPostId(postId);
    if (poll) {
      const { data: voteData } = await (supabase as any)
        .from("community_poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("user_id", userId)
        .maybeSingle();
      pollVoteOptionId = voteData?.option_id ?? null;
    }

    return {
      isLiked: !!likeData.data,
      isSaved: !!savedData.data,
      hasConfirmed,
      pollVoteOptionId,
    };
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostUserInteractions",
      metadata: { postId, userId },
    });
    return {
      isLiked: false,
      isSaved: false,
      hasConfirmed: false,
      pollVoteOptionId: null,
    };
  }
}

export async function getPostMentions(postId: string): Promise<
  Array<{
    id: string;
    name: string;
    avatar: string | null;
    location: string | null;
    type: string;
    rank: number;
  }>
> {
  try {
    const { data: mentions } = await (supabase as any)
      .from("community_post_mentions")
      .select(
        `
          mentioned_profile:profiles!mentioned_profile_id (
            id,
            name,
            avatar_url,
            neighborhood,
            type
          ),
          rank
        `,
      )
      .eq("post_id", postId);

    return (mentions || []).map((m: any) => ({
      id: m.mentioned_profile.id,
      name: m.mentioned_profile.name,
      avatar: m.mentioned_profile.avatar_url,
      location: m.mentioned_profile.neighborhood,
      type: m.mentioned_profile.type,
      rank: m.rank,
    }));
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostMentions",
      metadata: { postId },
    });
    return [];
  }
}

export async function getFollowedPostUserIds(postId: string): Promise<string[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("followed_posts")
      .select("user_id")
      .eq("post_id", postId);

    if (error) {
      throw new PostError(
        error.message,
        error.code || "FETCH_FOLLOWED_POST_USERS_FAILED",
      );
    }

    return (data || [])
      .map((row: any) => row.user_id)
      .filter((userId: unknown): userId is string => typeof userId === "string");
  } catch (error) {
    if (error instanceof PostError) throw error;
    trackError(error as Error, {
      component: "posts.queries",
      action: "getFollowedPostUserIds",
      metadata: { postId },
    });
    throw new PostError("Unexpected error fetching post followers", "UNKNOWN_ERROR");
  }
}


export async function getSavedPosts(
  userId: string,
  params: PaginationParams = {},
): Promise<Post[]> {
  try {
    const { limit = PAGINATION.DEFAULT_LIMIT, offset = 0 } = params;
    const savedPosts = await SocialInteractionsService.getSavedPosts(userId, limit, offset);

    if (!savedPosts || savedPosts.length === 0) {
      return [];
    }

    const postIds = savedPosts.map((savedPost) => savedPost.post_id);
    const { data: posts, error } = await (supabase as any)
      .from("posts")
      .select(
        `
          *,
          author_profile:profiles!author_profile_id(*)
        `,
      )
      .in("id", postIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    return posts || [];
  } catch (error) {
    if (error instanceof PostError) throw error;
    trackError(error as Error, {
      component: "posts.queries",
      action: "getSavedPosts",
      metadata: { userId, limit: params.limit },
    });
    throw new PostError("Unexpected error fetching saved posts", "UNKNOWN_ERROR");
  }
}

export async function getPostsCountByProfile(profileId: string): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_profile_id", profileId);

    if (error) {
      throw new PostError(error.message, error.code || "COUNT_FAILED");
    }

    return count || 0;
  } catch (error) {
    if (error instanceof PostError) throw error;
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsCountByProfile",
      metadata: { profileId },
    });
    throw new PostError("Unexpected error counting posts", "UNKNOWN_ERROR");
  }
}

export async function getPostsCountByUser(userId: string): Promise<number> {
  try {
    const activeProfile = await profileService.getRequiredActiveProfile(userId);
    return getPostsCountByProfile(activeProfile.id);
  } catch (error) {
    if (error instanceof PostError) throw error;
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsCountByUser",
      metadata: { userId },
    });
    throw new PostError("Unexpected error counting user posts", "UNKNOWN_ERROR");
  }
}

export async function getPostActivityByAuthor(
  authorProfileId: string,
  from: number = 0,
  to: number = 19,
): Promise<
  Array<{
    id: string;
    type: "post_created";
    created_at: string;
    metadata: {
      post_id: string;
      post_type: string;
      post_content: string;
      likes_count: number;
      comments_count: number;
    };
  }>
> {
  try {
    const { data: posts, error } = await (supabase as any)
      .from("posts")
      .select("id, type, content, likes_count, comments_count, created_at")
      .eq("author_profile_id", authorProfileId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    return (posts || []).map((post: any) => ({
      id: `post_${post.id}`,
      type: "post_created" as const,
      created_at: post.created_at,
      metadata: {
        post_id: post.id,
        post_type: post.type,
        post_content: post.content,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
      },
    }));
  } catch (error) {
    if (error instanceof PostError) throw error;
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostActivityByAuthor",
      metadata: { authorProfileId, from, to },
    });
    throw new PostError("Unexpected error fetching post activity by author", "UNKNOWN_ERROR");
  }
}

export async function validatePostOwnership(
  postId: string,
  userId: string,
): Promise<boolean> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("posts")
      .select("author_profile_id, profile_id")
      .eq("id", postId)
      .maybeSingle();

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    if (!post) return false;

    const profiles = await profileService.getProfilesByIds([
      (post as any).author_profile_id || (post as any).profile_id,
    ]);
    if (!profiles || profiles.length === 0) return false;

    return profiles[0].user_id === userId;
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "validatePostOwnership",
      metadata: { postId, userId },
    });
    return false;
  }
}

export async function canUserCreatePost(userId: string): Promise<boolean> {
  try {
    const context = await profileService.getProfileContext(userId);
    if (!context) return false;

    return context.permissions.canPost;
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "canUserCreatePost",
      metadata: { userId },
    });
    return false;
  }
}

export async function canUserEditPost(postId: string, userId: string): Promise<boolean> {
  try {
    const canCreate = await canUserCreatePost(userId);
    if (!canCreate) return false;

    return validatePostOwnership(postId, userId);
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "canUserEditPost",
      metadata: { postId, userId },
    });
    return false;
  }
}

export async function canUserDeletePost(postId: string, userId: string): Promise<boolean> {
  try {
    return canUserEditPost(postId, userId);
  } catch (error) {
    trackError(error as Error, {
      component: "posts.queries",
      action: "canUserDeletePost",
      metadata: { postId, userId },
    });
    return false;
  }
}
