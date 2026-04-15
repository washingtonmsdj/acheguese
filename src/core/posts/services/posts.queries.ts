// @ts-nocheck
/**
 * 📦 POSTS QUERIES - SSOT v2.0
 *
 * Operações de leitura para posts.
 * Todas as queries são pure functions que recebem parâmetros e retornam dados.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import type {
  Post,
  PostStats,
  PaginationParams,
  FeedParams,
  FeedResult,
  Poll,
} from "../types";
import { PostError } from "../types";

// ============================================================================
// 🔍 POST QUERIES - Busca de posts
// ============================================================================

/**
 * Busca um post específico por ID com dados do autor
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("posts")
      .select(
        `
          *,
          author_profile:profiles!author_profile_id(*)
        `,
      )
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return post as Post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching post by ID:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostById",
      metadata: { postId },
    });
    throw new PostError("Erro ao buscar post", "FETCH_ERROR");
  }
}

/**
 * Busca posts do feed com expansão territorial
 * Suporta múltiplos location_ids para grupos
 */
export async function getFeed(params: FeedParams): Promise<FeedResult> {
  const {
    location_id,
    location_ids,
    district_filter,
    city_filter,
    context = "all",
    cursor,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = params;

  try {
    let query = (supabase as any)
      .from("posts")
      .select(
        `
        *,
        author_profile:profiles!author_profile_id(id, name, avatar_url, verified),
        location:locations(id, name, type, parent_id)
      `,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Aplicar filtros territoriais
    if (location_ids && location_ids.length > 0) {
      // Feed de grupo: busca posts de múltiplas localizações
      query = query.in("location_id", location_ids);
    } else if (location_id) {
      if (district_filter) {
        // Feed de distrito: inclui bairros (filho do parent)
        const { data: neighborhoods } = await (supabase as any)
          .from("locations")
          .select("id")
          .eq("parent_id", location_id);

        const neighborhoodIds = neighborhoods?.map((n: any) => n.id) || [];
        if (neighborhoodIds.length > 0) {
          query = query.in("location_id", [location_id, ...neighborhoodIds]);
        } else {
          query = query.eq("location_id", location_id);
        }
      } else if (city_filter) {
        // Feed de cidade: busca posts da cidade + distritos + bairros
        const { data: cityLocations } = await (supabase as any)
          .from("locations")
          .select("id")
          .or(`id.eq.${location_id},parent_id.eq.${location_id}`);

        const locationIds = cityLocations?.map((l: any) => l.id) || [
          location_id,
        ];
        query = query.in("location_id", locationIds);
      } else {
        // Feed simples: apenas a localização específica
        query = query.eq("location_id", location_id);
      }
    }

    // Paginação por cursor
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw new PostError(error.message, error.code);
    }

    // Calcular próximo cursor
    const nextCursor =
      posts && posts.length === limit
        ? posts[posts.length - 1].created_at
        : undefined;

    return {
      posts: (posts || []) as Post[],
      nextCursor,
      hasMore: !!nextCursor,
    };
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching feed:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getFeed",
      metadata: { location_id, location_ids, context },
    });
    throw new PostError("Erro ao carregar feed", "FEED_ERROR");
  }
}

/**
 * Busca posts por perfil (autor)
 */
export async function getPostsByProfile(
  profileId: string,
  params: PaginationParams = {},
): Promise<Post[]> {
  const { limit = PAGINATION.DEFAULT_LIMIT, offset = 0 } = params;

  try {
    const { data: posts, error } = await (supabase as any)
      .from("posts")
      .select(
        `
        *,
        author_profile:profiles!author_profile_id(id, name, avatar_url),
        location:locations(id, name, type, parent_id)
      `,
      )
      .eq("author_profile_id", profileId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (posts || []) as Post[];
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching posts by profile:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsByProfile",
      metadata: { profileId },
    });
    throw new PostError("Erro ao buscar posts do perfil", "FETCH_ERROR");
  }
}

/**
 * Busca posts por tipo com filtros opcionais
 */
export async function getPostsByType(
  type: string,
  filters?: { search?: string; location_id?: string },
): Promise<Post[]> {
  try {
    let query = (supabase as any)
      .from("posts")
      .select(
        `
        *,
        author_profile:profiles!author_profile_id(id, name, avatar_url),
        location:locations(id, name, type, parent_id)
      `,
      )
      .eq("type", type)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (filters?.location_id) {
      query = query.eq("location_id", filters.location_id);
    }

    // Busca textual no conteúdo
    if (filters?.search) {
      query = query.ilike("content", `%${filters.search}%`);
    }

    const { data: posts, error } = await query.limit(100);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (posts || []) as Post[];
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching posts by type:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsByType",
      metadata: { type, filters },
    });
    throw new PostError("Erro ao buscar posts por tipo", "FETCH_ERROR");
  }
}

// ============================================================================
// 📊 STATS QUERIES - Estatísticas e contagens
// ============================================================================

/**
 * Busca estatísticas de um post (curtidas, comentários)
 */
export async function getPostStats(postId: string): Promise<PostStats> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("posts")
      .select("likes_count, comments_count")
      .eq("id", postId)
      .single();

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return {
      likes_count: post?.likes_count || 0,
      comments_count: post?.comments_count || 0,
    };
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching post stats:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostStats",
      metadata: { postId },
    });
    throw new PostError("Erro ao buscar estatísticas", "FETCH_ERROR");
  }
}

/**
 * Conta posts por autor (author_profile_id)
 */
export async function getPostsCountByAuthor(
  authorProfileId: string,
): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_profile_id", authorProfileId)
      .eq("is_published", true);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error counting posts by author:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsCountByAuthor",
      metadata: { authorProfileId },
    });
    throw new PostError("Erro ao contar posts", "COUNT_ERROR");
  }
}

/**
 * Conta posts criados hoje por autor (rate limiting)
 */
export async function getPostsCountByAuthorToday(
  authorProfileId: string,
): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await (supabase as any)
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_profile_id", authorProfileId)
      .gte("created_at", today.toISOString());

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error counting posts today:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsCountByAuthorToday",
      metadata: { authorProfileId },
    });
    throw new PostError("Erro ao contar posts de hoje", "COUNT_ERROR");
  }
}

/**
 * Busca total de curtidas recebidas em posts de um autor
 */
export async function getPostsLikesReceivedByAuthor(
  authorProfileId: string,
): Promise<number> {
  try {
    const { data, error } = await (supabase as any)
      .from("posts")
      .select("likes_count")
      .eq("author_profile_id", authorProfileId)
      .eq("is_published", true);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (data || []).reduce(
      (sum: number, post: any) => sum + (post.likes_count || 0),
      0,
    );
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error counting likes received:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsLikesReceivedByAuthor",
      metadata: { authorProfileId },
    });
    throw new PostError("Erro ao contar curtidas", "COUNT_ERROR");
  }
}

/**
 * Busca total de posts cadastrados
 */
export async function getTotalPostsCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("posts")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return count || 0;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error counting total posts:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getTotalPostsCount",
    });
    throw new PostError("Erro ao contar posts", "COUNT_ERROR");
  }
}

/**
 * Busca posts recentes
 */
export async function getRecentPosts(
  limit = PAGINATION.SMALL_LIMIT,
): Promise<Post[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("posts")
      .select(
        `
        *,
        author_profile:profiles!author_profile_id(id, name, avatar_url),
        location:locations(id, name, type, parent_id)
      `,
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (data || []) as Post[];
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching recent posts:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getRecentPosts",
    });
    throw new PostError("Erro ao buscar posts recentes", "FETCH_ERROR");
  }
}

/**
 * Busca posts por categoria (usado para admin de alertas)
 * Suporta múltiplas categorias e tipos de post
 */
export async function getPostsByCategory(params: {
  categories?: string[];
  tipoPost?: string[];
  limit?: number;
}): Promise<Post[]> {
  try {
    const { categories, tipoPost, limit = 1000 } = params;

    let query = (supabase as any)
      .from("posts")
      .select(
        `
        *,
        author_profile:profiles!author_profile_id(id, name, avatar_url),
        location:locations(id, name, type, parent_id)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filtrar por categoria se fornecido
    if (categories && categories.length > 0) {
      query = query.in("category", categories);
    }

    // Filtrar por tipo_post se fornecido
    if (tipoPost && tipoPost.length > 0) {
      query = query.in("tipo_post", tipoPost);
    }

    const { data, error } = await query;

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (data || []) as Post[];
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching posts by category:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPostsByCategory",
    });
    throw new PostError("Erro ao buscar posts por categoria", "FETCH_ERROR");
  }
}

// ============================================================================
// 🔍 AUXILIARY QUERIES - Informações auxiliares
// ============================================================================

/**
 * Busca informações básicas de um post (para notificações)
 */
export async function getPostBasicInfo(
  postId: string,
): Promise<{ author_profile_id: string; content?: string } | null> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("posts")
      .select("author_profile_id, content")
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return post;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching post basic info:", error);
    return null;
  }
}

/**
 * Busca apenas o author_profile_id de um post
 */
export async function getPostAuthorId(
  postId: string,
): Promise<string | null> {
  try {
    const { data: post, error } = await (supabase as any)
      .from("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return post?.author_profile_id || null;
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching post author:", error);
    return null;
  }
}

// ============================================================================
// 🎯 TRENDING QUERIES - Posts em alta e populares
// ============================================================================

/**
 * Busca posts em alta (top engagement dos últimos 7 dias)
 */
export async function getTopPosts(
  locationId: string,
  limit = 5,
): Promise<Post[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: posts, error } = await (supabase as any)
      .from("posts")
      .select(
        `
        *,
        author_profile:profiles!author_profile_id(id, name, avatar_url),
        location:locations(id, name, type, parent_id)
      `,
      )
      .eq("is_published", true)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("likes_count", { ascending: false })
      .order("comments_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (posts || []) as Post[];
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching top posts:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getTopPosts",
      metadata: { locationId },
    });
    throw new PostError("Erro ao buscar posts em alta", "FETCH_ERROR");
  }
}

/**
 * Busca tags populares dos últimos 7 dias
 */
export async function getPopularTags(
  locationId: string,
  limit = PAGINATION.SMALL_LIMIT,
): Promise<Array<{ tag: string; count: number }>> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: posts, error } = await (supabase as any)
      .from("posts")
      .select("tags")
      .eq("is_published", true)
      .gte("created_at", sevenDaysAgo.toISOString())
      .not("tags", "is", null);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    // Contar ocorrências de tags
    const tagCounts: Record<string, number> = {};
    (posts || []).forEach((post: any) => {
      (post.tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Converter para array e ordenar
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    if (error instanceof PostError) throw error;

    logger.error("[posts.queries] Error fetching popular tags:", error);
    trackError(error as Error, {
      component: "posts.queries",
      action: "getPopularTags",
      metadata: { locationId },
    });
    throw new PostError("Erro ao buscar tags populares", "FETCH_ERROR");
  }
}
