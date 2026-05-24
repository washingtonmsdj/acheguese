/**
 * ✏️ POSTS MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para posts.
 * Todas as mutations são pure functions que recebem dados e retornam resultado.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { NotificationService } from "@/core/notifications/services/NotificationService";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { LocationType, EntityStatus } from "@/shared/types/enums";
import type { Post, CreatePostData, UpdatePostData } from "../types";
import { PostError } from "../types";
import * as queries from "./posts.queries";
import type { Json } from "@/integrations/supabase/types";

export type CreatePostTerritoryPolicy = {
  allowedLocationTypes?: readonly LocationType[];
  invalidLocationTypeCode?: string;
};

export const CREATE_POST_LOCATION_REQUIRED_CODE = "LOCATION_REQUIRED";

const DEFAULT_CREATE_POST_TERRITORY_POLICY: Required<CreatePostTerritoryPolicy> = {
  allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD],
  invalidLocationTypeCode: "INVALID_LOCATION_TYPE",
};

// ============================================================================
// 📝 POST MUTATIONS - CRUD de posts
// ============================================================================

/**
 * Cria um novo post com validação territorial SSOT
 */
export async function createPost(data: {
  author_profile_id: string;
  content: string;
  type: string;
  location_id: string;
  reach?: "street" | "neighborhood" | "city";
  images?: string[];
  tags?: string[];
  content_intent?: string;
  display_format?: string;
  distribution_channels?: string[];
  content_payload?: Record<string, unknown>;
}, policy: CreatePostTerritoryPolicy = DEFAULT_CREATE_POST_TERRITORY_POLICY): Promise<Post> {
  try {
    // 1. Validar location_id obrigatório
    if (!data.location_id) {
      throw new PostError("location_id é obrigatório", CREATE_POST_LOCATION_REQUIRED_CODE);
    }

    // 2. Validar que location existe
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id, type, status")
      .eq("id", data.location_id)
      .single();

    if (locationError || !location) {
      logger.error("[posts.mutations] Location not found:", {
        location_id: data.location_id,
        error: locationError?.message,
      });
      throw new PostError("Localização inválida", "INVALID_LOCATION");
    }

    // 3. Validar tipo (cidade, bairro municipal ou distrito IBGE)
    const allowedLocationTypes = policy.allowedLocationTypes ?? DEFAULT_CREATE_POST_TERRITORY_POLICY.allowedLocationTypes;
    if (!allowedLocationTypes.includes(location.type as LocationType)) {
      logger.error("[posts.mutations] Invalid location type:", {
        location_id: data.location_id,
        type: location.type,
      });
      throw new PostError(
        "Posts só podem ser criados em cidades ou bairros",
        policy.invalidLocationTypeCode ?? DEFAULT_CREATE_POST_TERRITORY_POLICY.invalidLocationTypeCode,
      );
    }

    // 4. Validar status (apenas active)
    if (location.status !== EntityStatus.ACTIVE) {
      logger.error("[posts.mutations] Inactive location:", {
        location_id: data.location_id,
        status: location.status,
      });
      throw new PostError("Localização inativa", "INACTIVE_LOCATION");
    }

    // 5. Criar post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_profile_id: data.author_profile_id,
        content: data.content,
        type: data.type,
        location_id: data.location_id,
        reach: data.reach || "neighborhood",
        images: data.images || [],
        tags: data.tags || [],
        content_intent: data.content_intent ?? null,
        display_format: data.display_format ?? null,
        distribution_channels: data.distribution_channels || [],
        content_payload: (data.content_payload ?? null) as Json,
        is_published: true,
      })
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

/**
 * Atualiza um post existente
 */
export async function updatePost(
  postId: string,
  data: UpdatePostData,
): Promise<Post> {
  try {
    const { updatePostSchema: UpdatePostSchema } =
      await import("@/core/posts/schemas/postSchemas");
    const validatedData = UpdatePostSchema.parse({
      content: data.content,
    });

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Adiciona campos apenas se fornecidos
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.video_url !== undefined) updateData.video_url = data.video_url;
    if (data.is_verified !== undefined) updateData.is_verified = data.is_verified;
    if (data.hidden !== undefined) updateData.hidden = data.hidden;

    const { data: post, error } = await (supabase as any)
      .from("posts")
      .update(updateData)
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
      throw new PostError(error.message, error.code);
    }

    return post as Post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    const { handleValidationError } = await import("@/shared/validation");
    const validationMessage = handleValidationError(error);
    if (validationMessage !== "Erro de validação desconhecido") {
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

/**
 * Deleta um post (soft delete)
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from("posts")
      .update({ is_published: false })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code);
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

/**
 * Deleta um post com verificação de ownership
 */
export async function deletePostByAuthor(
  postId: string,
  authorProfileId: string,
): Promise<void> {
  try {
    // Verificar ownership
    const { data: post, error: fetchError } = await (supabase as any)
      .from("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .single();

    if (fetchError) {
      throw new PostError("Post não encontrado", "NOT_FOUND");
    }

    if (post.author_profile_id !== authorProfileId) {
      throw new PostError(
        "Você não tem permissão para deletar este post",
        "FORBIDDEN",
      );
    }

    // Soft delete
    const { error } = await (supabase as any)
      .from("posts")
      .update({ is_published: false })
      .eq("id", postId)
      .eq("author_profile_id", authorProfileId);

    if (error) {
      throw new PostError(error.message, error.code);
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

// ============================================================================
// 📢 ENGAGEMENT MUTATIONS - Interações sociais
// ============================================================================

/**
 * Incrementa contador de compartilhamentos
 */
export async function incrementSharesCount(postId: string): Promise<void> {
  try {
    // Buscar contagem atual
    const { data: post, error: fetchError } = await (supabase as any)
      .from("posts")
      .select("shares_count")
      .eq("id", postId)
      .single();

    if (fetchError) {
      throw new PostError("Post não encontrado", "NOT_FOUND");
    }

    // Incrementar
    const { error } = await (supabase as any)
      .from("posts")
      .update({ shares_count: (post.shares_count || 0) + 1 })
      .eq("id", postId);

    if (error) {
      throw new PostError(error.message, error.code);
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

/**
 * Incrementa reputação do usuário via RPC
 */
export async function incrementUserReputation(
  userId: string,
  points: number,
): Promise<void> {
  try {
    const { error } = await (supabase as any).rpc(
      "increment_user_reputation",
      {
        user_id: userId,
        points,
      },
    );

    if (error) {
      logger.error("[posts.mutations] Error incrementing reputation:", error);
      // Não lançar erro - reputação é não-crítico
    }
  } catch (error) {
    logger.error("[posts.mutations] Error in incrementUserReputation:", error);
    // Silenciar erro - reputação é não-crítico
  }
}

export async function toggleFollowPost(
  postId: string,
  userId: string,
): Promise<{ action: "follow" | "unfollow" }> {
  try {
    const { data: existing } = await (supabase as any)
      .from("followed_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await (supabase as any)
        .from("followed_posts")
        .delete()
        .eq("id", existing.id);
      if (error) throw new PostError(error.message, error.code || "UNFOLLOW_FAILED");
      return { action: "unfollow" };
    }

    const { error } = await (supabase as any)
      .from("followed_posts")
      .insert({ post_id: postId, user_id: userId });
    if (error) throw new PostError(error.message, error.code || "FOLLOW_FAILED");
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

export async function createLikeNotification(
  postId: string,
  likerId: string,
): Promise<void> {
  try {
    const postInfo = await queries.getPostBasicInfo(postId);
    if (!postInfo || postInfo.author_profile_id === likerId) return;

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
    const { error } = await (supabase as any)
      .from("posts")
      .update({
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
    const { error } = await (supabase as any)
      .from("posts")
      .update({ is_hidden: true })
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

export async function confirmAlert(
  postId: string,
  userId: string,
  authorProfileId: string,
): Promise<{
  confirmationsCount: number;
  isVerified: boolean;
}> {
  try {
    const { data: post, error: updateError } = await (supabase as any)
      .from("posts")
      .select("confirmations_count, is_verified")
      .eq("id", postId)
      .single();

    if (updateError) {
      throw new PostError(updateError.message, updateError.code || "FETCH_FAILED");
    }

    const newCount = (post.confirmations_count || 0) + 1;
    const shouldVerify = newCount >= 5;

    const { error: confirmError } = await (supabase as any)
      .from("posts")
      .update({
        confirmations_count: newCount,
        is_verified: shouldVerify || post.is_verified,
      })
      .eq("id", postId);

    if (confirmError) {
      throw new PostError(confirmError.message, confirmError.code || "CONFIRM_FAILED");
    }

    if (shouldVerify && !post.is_verified) {
      await incrementUserReputation(authorProfileId, 5);
    }

    return { confirmationsCount: newCount, isVerified: shouldVerify || post.is_verified };
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
