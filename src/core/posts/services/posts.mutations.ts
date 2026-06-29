/**
 * Post write operations.
 */

import { NotificationService } from "@/core/notifications/services/NotificationService";
import { supabase } from "@/integrations/supabase";
import type { Database, Json } from "@/integrations/supabase";
import { EntityStatus, LocationType } from "@/shared/types/enums";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { CreatePostData, Post, UpdatePostData } from "../types";
import { PostError } from "../types";
import * as queries from "./posts.queries";

type DbPostRow = Database["public"]["Tables"]["posts"]["Row"];
type DbPostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type DbPostUpdate = Database["public"]["Tables"]["posts"]["Update"];

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
  maybeSingle: () => Promise<QueryResult<TRow>>;
}

interface PostsMutationDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
  rpc: <TResult = unknown>(
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<QueryResult<TResult>>;
}

type CreatePostPayload = { author_profile_id: string } & CreatePostData;

type PostUpdatePayload = Partial<
  Pick<DbPostUpdate, "content" | "image_url" | "video_url" | "is_verified" | "updated_at">
> & {
  hidden?: boolean;
};

type PostModerationState = {
  is_hidden?: boolean;
  is_removed?: boolean;
  is_published?: boolean;
  removed_reason?: string | null;
  removed_by?: string | null;
  removed_at?: string | null;
};

interface LocationValidationRow {
  id: string;
  type: string;
  status: string;
}

interface PostMutationSelectRow extends DbPostRow {
  author_profile?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    verified?: boolean | null;
  } | null;
  location?: {
    id: string;
    name: string;
    type: string;
    parent_id: string | null;
  } | null;
  hidden?: boolean | null;
  is_hidden?: boolean | null;
  is_removed?: boolean | null;
  removed_reason?: string | null;
  removed_at?: string | null;
  removed_by?: string | null;
  shares_count?: number | null;
}

interface PostAuthorRow {
  author_profile_id: string;
}

interface PostSharesRow {
  shares_count: number | null;
}

interface FollowedPostRow {
  id: string;
}

interface AlertConfirmationRow {
  confirmations_count: number | null;
  is_verified: boolean | null;
}

const postsMutationDb = supabase as unknown as PostsMutationDbClient;

export type CreatePostTerritoryPolicy = {
  allowedLocationTypes?: readonly LocationType[];
  invalidLocationTypeCode?: string;
};

export const CREATE_POST_LOCATION_REQUIRED_CODE = "LOCATION_REQUIRED";

const DEFAULT_CREATE_POST_TERRITORY_POLICY: Required<CreatePostTerritoryPolicy> = {
  allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD],
  invalidLocationTypeCode: "INVALID_LOCATION_TYPE",
};

function buildCreatePostInsert(data: CreatePostPayload): DbPostInsert {
  return {
    author_profile_id: data.author_profile_id,
    content: data.content,
    type: data.type,
    location_id: data.location_id,
    reach: data.reach ?? "neighborhood",
    image_url: data.image_url ?? null,
    video_url: data.video_url ?? null,
    images: ((data.images ?? []) as unknown) as Json,
    tags: ((data.tags ?? []) as unknown) as Json,
    content_intent: data.content_intent ?? null,
    display_format: data.display_format ?? null,
    distribution_channels: data.distribution_channels ?? [],
    content_payload: ((data.content_payload ?? null) as unknown) as Json,
    is_published: true,
  };
}

function buildUpdatePostPayload(
  validatedContent: string | undefined,
  data: UpdatePostData,
): PostUpdatePayload {
  const updateData: PostUpdatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (validatedContent !== undefined) updateData.content = validatedContent;
  if (data.image_url !== undefined) updateData.image_url = data.image_url;
  if (data.video_url !== undefined) updateData.video_url = data.video_url;
  if (data.is_verified !== undefined) updateData.is_verified = data.is_verified;
  if (data.hidden !== undefined) updateData.hidden = data.hidden;

  return updateData;
}

function isAllowedLocationType(
  locationType: string,
  policy: Required<CreatePostTerritoryPolicy>,
): boolean {
  return policy.allowedLocationTypes.includes(locationType as LocationType);
}

export async function createPost(
  data: CreatePostPayload,
  policy: CreatePostTerritoryPolicy = DEFAULT_CREATE_POST_TERRITORY_POLICY,
): Promise<Post> {
  try {
    if (!data.location_id) {
      throw new PostError("location_id e obrigatorio", CREATE_POST_LOCATION_REQUIRED_CODE);
    }

    const { data: location, error: locationError } = await postsMutationDb
      .from<LocationValidationRow>("locations")
      .select("id, type, status")
      .eq("id", data.location_id)
      .single();

    if (locationError || !location) {
      logger.error("[posts.mutations] Location not found:", {
        location_id: data.location_id,
        error: locationError?.message,
      });
      throw new PostError("Localizacao invalida", "INVALID_LOCATION");
    }

    const resolvedPolicy = {
      allowedLocationTypes:
        policy.allowedLocationTypes ?? DEFAULT_CREATE_POST_TERRITORY_POLICY.allowedLocationTypes,
      invalidLocationTypeCode:
        policy.invalidLocationTypeCode ??
        DEFAULT_CREATE_POST_TERRITORY_POLICY.invalidLocationTypeCode,
    };

    if (!isAllowedLocationType(location.type, resolvedPolicy)) {
      logger.error("[posts.mutations] Invalid location type:", {
        location_id: data.location_id,
        type: location.type,
      });
      throw new PostError(
        "Posts so podem ser criados em cidades ou bairros",
        resolvedPolicy.invalidLocationTypeCode,
      );
    }

    if (location.status !== EntityStatus.ACTIVE) {
      logger.error("[posts.mutations] Inactive location:", {
        location_id: data.location_id,
        status: location.status,
      });
      throw new PostError("Localizacao inativa", "INACTIVE_LOCATION");
    }

    const { data: post, error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .insert(buildCreatePostInsert(data))
      .select(
        `
          id,
          author_profile_id,
          content,
          type,
          location_id,
          reach,
          images,
          tags,
          content_intent,
          display_format,
          distribution_channels,
          content_payload,
          likes_count,
          comments_count,
          confirmations_count,
          is_verified,
          is_published,
          created_at,
          updated_at,
          author_profile:profiles!author_profile_id(
            id,
            name,
            avatar_url,
            verified
          ),
          location:locations(
            id,
            name,
            type,
            parent_id
          )
        `,
      )
      .single();

    if (error) {
      logger.error("[posts.mutations] Insert error:", {
        error: error.message,
        code: error.code,
      });
      throw new PostError(error.message, error.code || "CREATE_FAILED");
    }

    return post as unknown as Post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.mutations] Error creating post:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "createPost",
      metadata: {
        author_profile_id: data.author_profile_id,
        type: data.type,
        location_id: data.location_id,
      },
    });
    throw new PostError("Erro inesperado ao criar post", "UNKNOWN_ERROR");
  }
}

export async function updatePost(postId: string, data: UpdatePostData): Promise<Post> {
  try {
    const { updatePostSchema: updatePostSchema } =
      await import("@/core/posts/schemas/postSchemas");
    const validatedData = updatePostSchema.parse({
      content: data.content,
    });

    const { data: post, error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update(buildUpdatePostPayload(validatedData.content, data))
      .eq("id", postId)
      .select(
        `
          *,
          author_profile:profiles!author_profile_id(id, name, avatar_url),
          location:locations(id, name, type, parent_id)
        `,
      )
      .single();

    if (error) {
      throw new PostError(error.message, error.code || "UPDATE_FAILED");
    }

    return post as unknown as Post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    const { handleValidationError } = await import("@/shared/validation");
    const validationMessage = handleValidationError(error);
    if (validationMessage !== "Erro de validacao desconhecido") {
      throw new PostError(validationMessage, "VALIDATION_ERROR", 400);
    }

    logger.error("[posts.mutations] Error updating post:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "updatePost",
      metadata: { postId },
    });
    throw new PostError("Erro ao atualizar post", "UPDATE_ERROR");
  }
}

export async function deletePost(postId: string): Promise<void> {
  try {
    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({ is_published: false })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code || "DELETE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.mutations] Error deleting post:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "deletePost",
      metadata: { postId },
    });
    throw new PostError("Erro ao deletar post", "DELETE_ERROR");
  }
}

export async function deletePostByAuthor(postId: string, authorProfileId: string): Promise<void> {
  try {
    const { data: post, error: fetchError } = await postsMutationDb
      .from<PostAuthorRow>("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new PostError("Post nao encontrado", "NOT_FOUND");
    }

    if (post.author_profile_id !== authorProfileId) {
      throw new PostError("Voce nao tem permissao para deletar este post", "FORBIDDEN");
    }

    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({ is_published: false })
      .eq("id", postId)
      .eq("author_profile_id", authorProfileId);

    if (error) {
      throw new PostError(error.message, error.code || "DELETE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.mutations] Error deleting post by author:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "deletePostByAuthor",
      metadata: { postId, authorProfileId },
    });
    throw new PostError("Erro ao deletar post", "DELETE_ERROR");
  }
}

export async function incrementSharesCount(postId: string): Promise<void> {
  try {
    const { data: post, error: fetchError } = await postsMutationDb
      .from<PostSharesRow>("posts")
      .select("shares_count")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new PostError("Post nao encontrado", "NOT_FOUND");
    }

    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({ shares_count: (post.shares_count ?? 0) + 1 })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code || "UPDATE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.mutations] Error incrementing shares:", error);
    trackError(error as Error, {
      component: "posts.mutations",
      action: "incrementSharesCount",
      metadata: { postId },
    });
    throw new PostError("Erro ao incrementar compartilhamentos", "UPDATE_ERROR");
  }
}

export async function incrementUserReputation(userId: string, points: number): Promise<void> {
  try {
    const { error } = await postsMutationDb.rpc("increment_user_reputation", {
      user_id: userId,
      points,
    });

    if (error) {
      logger.error("[posts.mutations] Error incrementing reputation:", error);
    }
  } catch (error) {
    logger.error("[posts.mutations] Error in incrementUserReputation:", error);
  }
}

export async function toggleFollowPost(
  postId: string,
  userId: string,
): Promise<{ action: "follow" | "unfollow" }> {
  try {
    const { data: existing } = await postsMutationDb
      .from<FollowedPostRow>("followed_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await postsMutationDb
        .from<FollowedPostRow>("followed_posts")
        .delete()
        .eq("id", existing.id);

      if (error) {
        throw new PostError(error.message, error.code || "UNFOLLOW_FAILED");
      }

      return { action: "unfollow" };
    }

    const { error } = await postsMutationDb
      .from<FollowedPostRow>("followed_posts")
      .insert({ post_id: postId, user_id: userId });

    if (error) {
      throw new PostError(error.message, error.code || "FOLLOW_FAILED");
    }

    return { action: "follow" };
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.mutations",
      action: "toggleFollowPost",
      metadata: { postId, userId },
    });
    throw new PostError("Unexpected error toggling follow", "UNKNOWN_ERROR");
  }
}

export async function createLikeNotification(postId: string, likerId: string): Promise<void> {
  try {
    const postInfo = await queries.getPostBasicInfo(postId);
    if (!postInfo || postInfo.author_profile_id === likerId) {
      return;
    }

    await NotificationService.createNotification({
      user_id: postInfo.author_profile_id,
      type: "info",
      title: "Novo like no seu post",
      message: `Alguem curtiu seu post: ${postInfo.title?.substring(0, 50) ?? ""}...`,
      priority: "low",
      metadata: { post_id: postId, liker_id: likerId },
    });
  } catch (error) {
    trackError(error as Error, {
      component: "posts.mutations",
      action: "createLikeNotification",
      metadata: { postId, likerId },
    });
  }
}

export async function removePost(
  postId: string,
  reason: string,
  moderatorProfileId: string,
): Promise<void> {
  try {
    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({
        is_published: false,
        is_removed: true,
        removed_reason: reason,
        removed_at: new Date().toISOString(),
        removed_by: moderatorProfileId,
      })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code || "REMOVE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.mutations",
      action: "removePost",
      metadata: { postId, reason, moderatorProfileId },
    });
    throw new PostError("Unexpected error removing post", "UNKNOWN_ERROR");
  }
}

export async function hidePost(postId: string): Promise<void> {
  try {
    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({
        is_hidden: true,
        is_published: false,
      })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code || "HIDE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.mutations",
      action: "hidePost",
      metadata: { postId },
    });
    throw new PostError("Unexpected error hiding post", "UNKNOWN_ERROR");
  }
}

export async function updatePostModerationState(
  postId: string,
  state: PostModerationState,
): Promise<void> {
  try {
    const { error } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update(state)
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code || "MODERATION_UPDATE_FAILED");
    }
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.mutations",
      action: "updatePostModerationState",
      metadata: { postId, state },
    });
    throw new PostError("Unexpected error updating post moderation state", "UNKNOWN_ERROR");
  }
}

export async function confirmAlert(
  postId: string,
  userId: string,
  authorProfileId: string,
): Promise<{
  confirmationsCount: number;
  isVerified: boolean;
}> {
  try {
    const { data: post, error: fetchError } = await postsMutationDb
      .from<AlertConfirmationRow>("posts")
      .select("confirmations_count, is_verified")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new PostError(fetchError?.message ?? "Post not found", fetchError?.code || "FETCH_FAILED");
    }

    const newCount = (post.confirmations_count ?? 0) + 1;
    const shouldVerify = newCount >= 5;
    const resolvedIsVerified = shouldVerify || Boolean(post.is_verified);

    const { error: confirmError } = await postsMutationDb
      .from<PostMutationSelectRow>("posts")
      .update({
        confirmations_count: newCount,
        is_verified: resolvedIsVerified,
      })
      .eq("id", postId);

    if (confirmError) {
      throw new PostError(confirmError.message, confirmError.code || "CONFIRM_FAILED");
    }

    if (shouldVerify && !post.is_verified) {
      await incrementUserReputation(authorProfileId, 5);
    }

    return {
      confirmationsCount: newCount,
      isVerified: resolvedIsVerified,
    };
  } catch (error) {
    if (error instanceof PostError) throw error;

    trackError(error as Error, {
      component: "posts.mutations",
      action: "confirmAlert",
      metadata: { postId, userId },
    });
    throw new PostError("Unexpected error confirming alert", "UNKNOWN_ERROR");
  }
}
