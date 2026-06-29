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
import { buildSafeILikePattern } from "@/shared/utils/sqlSanitization";
import type {
  Post,
  PostStats,
  PaginationParams,
  FeedParams,
  FeedResult,
} from "../types";
import { PostError } from "../types";

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns: string, options?: { count?: "exact"; head?: boolean }) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  in: (column: string, values: unknown[]) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
  not: (column: string, operator: string, value: unknown) => QueryBuilder<TRow>;
  ilike: (column: string, value: string) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lt: (column: string, value: string | number) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  range: (from: number, to: number) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
}

interface PostsQueryDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

interface LocationIdRow {
  id: string;
}

interface PostStatRow {
  likes_count: number | null;
  comments_count: number | null;
}

interface PostBasicInfoRow {
  author_profile_id: string;
  title?: string | null;
  content?: string | null;
}

interface TopPostRow {
  id: string;
  content: string | null;
  likes_count: number | null;
  comments_count: number | null;
  author?: { name?: string | null } | null;
}

interface PostTagsRow {
  tags?: string[] | null;
}

const postsQueryDb = supabase as unknown as PostsQueryDbClient;

// ============================================================================
// 🔍 POST QUERIES - Busca de posts
// ============================================================================

/**
 * Busca um post específico por ID com dados do autor
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const { data: post, error } = await postsQueryDb
      .from<Post>("posts")
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
    includeStreetReach = false,
    context = "all",
    cursor,
    limit = PAGINATION.DEFAULT_LIMIT,
  } = params;

  try {
    let query = postsQueryDb
      .from<Post>("posts")
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

    if (!includeStreetReach) {
      query = query.or("reach.is.null,reach.neq.street");
    }

    // Aplicar filtros territoriais
    if (location_ids && location_ids.length > 0) {
      // Feed de grupo: busca posts de múltiplas localizações
      query = query.in("location_id", location_ids);
    } else if (location_id) {
      if (district_filter) {
        // Feed de distrito: inclui bairros (filho do parent)
        const { data: neighborhoods } = await postsQueryDb
          .from<LocationIdRow>("locations")
          .select("id")
          .eq("parent_id", location_id);

        const neighborhoodIds = ((neighborhoods as LocationIdRow[] | null) ?? []).map((n) => n.id);
        if (neighborhoodIds.length > 0) {
          query = query.in("location_id", [location_id, ...neighborhoodIds]);
        } else {
          query = query.eq("location_id", location_id);
        }
      } else if (city_filter) {
        // Feed de cidade: busca posts da cidade + distritos + bairros
        const { data: cityLocations } = await postsQueryDb
          .from<LocationIdRow>("locations")
          .select("id")
          .or(`id.eq.${location_id},parent_id.eq.${location_id}`);

        const locationIds = ((cityLocations as LocationIdRow[] | null) ?? []).map((l) => l.id) || [
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
      posts: (posts as Post[] | null) ?? [],
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
    const { data: posts, error } = await postsQueryDb
      .from<Post>("posts")
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

    return (posts as Post[] | null) ?? [];
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
    let query = postsQueryDb
      .from<Post>("posts")
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
      const pattern = buildSafeILikePattern(filters.search);
      if (pattern) {
        query = query.ilike("content", pattern);
      }
    }

    const { data: posts, error } = await query.limit(100);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return (posts as Post[] | null) ?? [];
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
    const { data: post, error } = await postsQueryDb
      .from<PostStatRow>("posts")
      .select("likes_count, comments_count")
      .eq("id", postId)
      .single();

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return {
      likes_count: (post as PostStatRow | null)?.likes_count || 0,
      comments_count: (post as PostStatRow | null)?.comments_count || 0,
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
    const { count, error } = await postsQueryDb
      .from<Post>("posts")
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

    const { count, error } = await postsQueryDb
      .from<Post>("posts")
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
    const { data, error } = await postsQueryDb
      .from<PostStatRow>("posts")
      .select("likes_count")
      .eq("author_profile_id", authorProfileId)
      .eq("is_published", true);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return ((data as PostStatRow[] | null) ?? []).reduce(
      (sum, post) => sum + (post.likes_count || 0),
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
    const { count, error } = await postsQueryDb
      .from<Post>("posts")
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
    const { data, error } = await postsQueryDb
      .from<Post>("posts")
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

    return (data as Post[] | null) ?? [];
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

    let query = postsQueryDb
      .from<Post>("posts")
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

    return (data as Post[] | null) ?? [];
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
): Promise<{ author_profile_id: string; title?: string; content?: string } | null> {
  try {
    const { data: post, error } = await postsQueryDb
      .from<PostBasicInfoRow>("posts")
      .select("author_profile_id, title, content")
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return (post as PostBasicInfoRow | null) ?? null;
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
    const { data: post, error } = await postsQueryDb
      .from<Pick<PostBasicInfoRow, "author_profile_id">>("posts")
      .select("author_profile_id")
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new PostError(error.message, error.code);
    }

    return (post as Pick<PostBasicInfoRow, "author_profile_id"> | null)?.author_profile_id || null;
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
): Promise<
  Array<{
    id: string;
    content: string;
    author_name: string;
    engagement: number;
  }>
> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: posts, error } = await postsQueryDb
      .from<TopPostRow>("posts")
      .select(
        `
        id,
        content,
        likes_count,
        comments_count,
        author:profiles!author_profile_id(name)
      `,
      )
      .eq("location_id", locationId)
      .eq("is_published", true)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("likes_count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    return ((posts as TopPostRow[] | null) ?? []).map((post) => ({
      id: post.id,
      content:
        (post.content || "").substring(0, 100) +
        ((post.content || "").length > 100 ? "..." : ""),
      author_name: post.author?.name || "Usuário",
      engagement: (post.likes_count || 0) + (post.comments_count || 0),
    }));
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
  limit: number = PAGINATION.SMALL_LIMIT,
): Promise<Array<{ tag: string; count: number }>> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: posts, error } = await postsQueryDb
      .from<PostTagsRow>("posts")
      .select("tags")
      .eq("location_id", locationId)
      .eq("is_published", true)
      .gte("created_at", sevenDaysAgo.toISOString())
      .not("tags", "is", null);

    if (error) {
      throw new PostError(error.message, error.code);
    }

    // Contar ocorrências de tags
    const tagCounts = new Map<string, number>();
    ((posts as PostTagsRow[] | null) ?? []).forEach((post) => {
      (post.tags || []).forEach((tag) => {
        const currentCount = tagCounts.get(tag) ?? 0;
        tagCounts.set(tag, currentCount + 1);
      });
    });

    // Converter para array e ordenar
    return Array.from(tagCounts.entries())
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


export * from "./posts.media.queries";
export * from "./posts.alerts.queries";
export * from "./posts.feed.queries";
export * from "./posts.user.queries";
