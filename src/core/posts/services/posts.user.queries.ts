/**
 * Post user and interaction queries.
 */

import { profileService } from "@/core/profiles/services/ProfileService";
import { PostEngagementService } from "@/core/engagement";
import { supabase } from "@/integrations/supabase";
import { PAGINATION } from "@/shared/constants";
import { trackError } from "@/shared/utils/errorTracking";
import type { PaginationParams, Post } from "../types";
import { PostError } from "../types";
import * as pollQueries from "./polls.queries";

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns: string) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  range: (from: number, to: number) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
}

interface CustomTableClient<TRow> {
  select: (columns: string) => QueryBuilder<TRow>;
}

interface PostsUserQueryDbClient {
  from: <TRow = never>(table: string) => CustomTableClient<TRow>;
}

const postsUserDb = supabase as unknown as PostsUserQueryDbClient;

function boundedInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(Math.max(Math.trunc(value), minimum), maximum);
}

interface PollVoteRow {
  option_id: string | null;
}

interface AuthorActivityPostRow {
  id: string;
  type: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface OwnershipPostRow {
  author_profile_id: string | null;
  profile_id: string | null;
}

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

    let pollVoteOptionId: string | null = null;
    const poll = await pollQueries.getPollByPostId(postId);
    if (poll) {
      const { data: voteData } = await postsUserDb
        .from("community_poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("user_id", userId)
        .maybeSingle();

      pollVoteOptionId = (voteData as PollVoteRow | null)?.option_id ?? null;
    }

    return {
      isLiked: Boolean(likeData.data),
      isSaved: Boolean(savedData.data),
      hasConfirmed: false,
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

export async function getSavedPosts(
  params: PaginationParams = {},
): Promise<Post[]> {
  try {
    const limit = boundedInteger(params.limit ?? PAGINATION.DEFAULT_LIMIT, 1, 100);
    const requestedOffset = params.offset ?? 0;
    const offset = boundedInteger(requestedOffset, 0, 10_000);
    if (Number.isFinite(requestedOffset) && requestedOffset > 10_000) return [];
    const savedPosts = await PostEngagementService.getSavedPosts(limit, offset);

    if (!savedPosts || savedPosts.length === 0) {
      return [];
    }

    const postIds = savedPosts.map((savedPost) => savedPost.post_id);
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
          *,
          author_profile:profiles!author_profile_id(id, name, display_name, avatar_url, verified)
        `,
      )
      .in("id", postIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    return (data as Post[] | null) ?? [];
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.queries",
      action: "getSavedPosts",
      metadata: { limit: params.limit },
    });
    throw new PostError("Unexpected error fetching saved posts", "UNKNOWN_ERROR");
  }
}

export async function getPostsCountByProfile(profileId: string): Promise<number> {
  try {
    const { count, error } = await supabase
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
    if (Number.isFinite(from) && from > 10_000) return [];
    const boundedFrom = boundedInteger(from, 0, 10_000);

    const requestedSize = Math.trunc(to) - boundedFrom + 1;
    if (!Number.isFinite(requestedSize) || requestedSize < 1) return [];
    const boundedTo = boundedFrom + Math.min(requestedSize, 100) - 1;

    const { data, error } = await supabase
      .from("posts")
      .select("id, type, content, likes_count, comments_count, created_at")
      .eq("author_profile_id", authorProfileId)
      .order("created_at", { ascending: false })
      .range(boundedFrom, boundedTo);

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    return ((data as AuthorActivityPostRow[] | null) ?? []).map((post) => ({
      id: `post_${post.id}`,
      type: "post_created",
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

export async function validatePostOwnership(postId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await postsUserDb
      .from("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .maybeSingle();

    if (error) {
      throw new PostError(error.message, error.code || "FETCH_FAILED");
    }

    const post = data as OwnershipPostRow | null;
    if (!post) return false;

    const ownerProfileId = post.author_profile_id || post.profile_id;
    if (!ownerProfileId) return false;

    const profiles = await profileService.getProfilesByIds([ownerProfileId]);
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
