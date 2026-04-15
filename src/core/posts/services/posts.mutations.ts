// @ts-nocheck
/**
 * ✏️ POSTS MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para posts.
 * Todas as mutations são pure functions que recebem dados e retornam resultado.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { LocationType, EntityStatus } from "@/shared/types/enums";
import type { Post, CreatePostData, UpdatePostData } from "../types";
import { PostError } from "../types";

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
}): Promise<Post> {
  try {
    // 1. Validar location_id obrigatório
    if (!data.location_id) {
      throw new PostError("location_id é obrigatório", "LOCATION_REQUIRED");
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

    // 3. Validar tipo (apenas city ou district)
    if (![LocationType.CITY, LocationType.DISTRICT].includes(location.type as any)) {
      logger.error("[posts.mutations] Invalid location type:", {
        location_id: data.location_id,
        type: location.type,
      });
      throw new PostError(
        "Posts só podem ser criados em cidades ou bairros",
        "INVALID_LOCATION_TYPE",
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
        images: data.images || [],
        tags: data.tags || [],
        is_published: true,
      })
      .select(
        `
          id,
          author_profile_id,
          content,
          type,
          location_id,
          images,
          tags,
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

    return post as Post;
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
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Adiciona campos apenas se fornecidos
    if (data.content !== undefined) updateData.content = data.content;
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
