/**
 * 🏛️ POSTS SERVICE FACADE - SSOT v2.0
 *
 * Fachada unificada para operações de posts.
 * Re-exporta queries, mutations e polls de módulos separados.
 *
 * ✅ SSOT: Single Source of Truth
 * ✅ Facade Pattern: Interface unificada
 * ✅ Backward Compatibility: Classes legadas mantidas
 * ✅ Tree Shakable: Import apenas o necessário
 *
 * @version 2.0.0 - Refatoração SSOT completa
 */
	
// ============================================================
// 📦 QUERIES - Operações de Leitura
// ============================================================
export {
  // Busca de posts
  getPostById,
  getFeed,
  getPostsByProfile,
  getPostsByType,
  getPostsByCategory,
  // Estatísticas
  getPostStats,
  getPostsCountByAuthor,
  getPostsCountByAuthorToday,
  getPostsLikesReceivedByAuthor,
  getTotalPostsCount,
  getRecentPosts,
  // Auxiliares
  getPostBasicInfo,
  getPostAuthorId,
  // Trending
  getTopPosts,
  getPopularTags,
} from "./posts.queries";

// ============================================================
// ✏️ MUTATIONS - Operações de Escrita
// ============================================================
export {
  // CRUD
  createPost,
  updatePost,
  deletePost,
  deletePostByAuthor,
  // Engagement
  incrementSharesCount,
  incrementUserReputation,
} from "./posts.mutations";

// ============================================================
// 🗳️ POLLS - Enquetes
// ============================================================
export {
  // Queries
  getPollById,
  getPollByPostId,
} from "./polls.queries";

export {
  // Mutations
  createPoll,
  updatePollVoteCounts,
  votePoll,
} from "./polls.mutations";
export type { Poll, CreatePollData } from "./polls.mutations";

// ============================================================
// 🏛️ FACADE UNIFICADA - PostsFacade
// ============================================================
import { logger } from '@/shared/utils/logger';
import * as queries from "./posts.queries";
import * as mutations from "./posts.mutations";
import * as pollMutations from "./polls.mutations";
import * as pollQueries from "./polls.queries";

/**
 * 🎯 PostsFacade - Interface SSOT unificada
 *
 * Uso: PostsFacade.queries.getPostById(id)
 *      PostsFacade.mutations.createPost(data)
 *      PostsFacade.polls.createPoll(data)
 */
export const PostsFacade = {
  queries,
  mutations,
  polls: {
    ...pollMutations,
    queries: pollQueries,
  },
} as const;

// ============================================================
// 🔄 BACKWARD COMPATIBILITY - PostService legado
// ============================================================
import { supabase } from "@/integrations/supabase";
import { NotificationType } from "@/core/notifications/types";
import { notificationService } from "@/core/notifications/services/NotificationService";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { trackError } from "@/shared/utils/errorTracking";
import { StructuredLogger } from "../utils/StructuredLogger";
import { LocationType, EntityStatus } from "@/shared/types/enums";
import { PAGINATION } from "@/shared/constants";
import { resolveCityToLocationIds, resolveNeighborhoodInCity } from "@/core/location/helpers/territorialResolver";
import { mediaService } from "@/core/media/services/MediaService";
import { mapPostsWithImagesRows } from "./post.service.rules";
import type {
  Post,
  PostType,
  FeedParams,
  FeedResult,
  CreatePostData,
  UpdatePostData,
  PostStats,
  PaginationParams,
  Poll,
  PollOption,
  CreatePollData,
} from "../types";
import { PostError } from "../types";

export class PostService {
  // ============================================================================
  // CRUD BÁSICO
  // ============================================================================

  /**
   * Cria um novo post
   */
  /**
   * Cria um novo post com SSOT territorial
   * Sprint 2 - Fase 2: Refatorado para usar location_id obrigatório
   */
  async createPost(data: {
    author_profile_id: string;
    content: string;
    type: string;
    location_id: string;
    reach?: 'street' | 'neighborhood' | 'city';
    images?: string[];
    tags?: string[];
    content_intent?: string;
    display_format?: string;
    distribution_channels?: string[];
    content_payload?: Record<string, unknown>;
  }): Promise<Post> {
    try {
      // 1. Validar location_id obrigatório
      if (!data.location_id) {
        throw new PostError("location_id é obrigatório", "LOCATION_REQUIRED");
      }

      // 2. Validar que location existe
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id, type, status')
        .eq('id', data.location_id)
        .single();

      if (locationError || !location) {
        logger.error('PostService: Location not found', {
          location_id: data.location_id,
          error: locationError?.message,
        });
        throw new PostError("Localização inválida", "INVALID_LOCATION");
      }

      // 3. Validar tipo (apenas city ou district)
      if (![LocationType.CITY, LocationType.DISTRICT].includes(location.type as any)) {
        logger.error('PostService: Invalid location type', {
          location_id: data.location_id,
          type: location.type,
        });
        throw new PostError(
          "Posts só podem ser criados em cidades ou bairros",
          "INVALID_LOCATION_TYPE"
        );
      }

      // 4. Validar status (apenas active)
      if (location.status !== EntityStatus.ACTIVE) {
        logger.error('PostService: Inactive location', {
          location_id: data.location_id,
          status: location.status,
        });
        throw new PostError("Localização inativa", "INACTIVE_LOCATION");
      }

      // 5. Criar post (trigger também validará type e status como camada extra)
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          author_profile_id: data.author_profile_id,
          content: data.content,
          type: data.type,
          location_id: data.location_id,
          reach: data.reach || 'neighborhood',
          images: data.images || [],
          tags: data.tags || [],
          content_intent: data.content_intent ?? null,
          display_format: data.display_format ?? null,
          distribution_channels: data.distribution_channels || [],
          content_payload: data.content_payload ?? null,
          is_published: true,
        })
        .select(`
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
        `)
        .single();

      if (error) {
        logger.error('PostService: Insert error', {
          error: error.message,
          code: error.code,
        });
        throw new PostError(error.message, error.code || "CREATE_FAILED");
      }

      return post as Post;
    } catch (error) {
      if (error instanceof PostError) throw error;
      
      logger.error('PostService: Unexpected error', {
        error: (error as Error).message,
      });
      trackError(error as Error, {
        component: "PostService",
        action: "createPost",
        metadata: { author_profile_id: data.author_profile_id, type: data.type },
      });
      throw new PostError("Unexpected error creating post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca um post específico por ID
   */
  async getPostById(postId: string): Promise<Post | null> {
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
        .maybeSingle();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return post;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostById",
        metadata: { postId },
      });
      throw new PostError("Unexpected error fetching post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Atualiza um post
   */
  async updatePost(postId: string, data: UpdatePostData): Promise<Post> {
    try {
      // ✅ FUNDAÇÃO 3: Validar dados de entrada
      const { updatePostSchema: UpdatePostSchema } =
        await import("@/core/posts/schemas/postSchemas");
      const validatedData = UpdatePostSchema.parse({
        content: data.content,
      });

      const updateData: any = {};
      if (validatedData.content !== undefined) {
        updateData.content = validatedData.content;
      }
      if (data.image_url !== undefined) {
        updateData.image_url = data.image_url;
      }
      if (data.video_url !== undefined) {
        updateData.video_url = data.video_url;
      }

      const { data: post, error } = await (supabase as any)
        .from("posts")
        .update(updateData)
        .eq("id", postId)
        .select(
          `
          *,
          author_profile:profiles!author_profile_id(*)
        `,
        )
        .single();

      if (error) {
        throw new PostError(error.message, error.code || "UPDATE_FAILED");
      }

      return post;
    } catch (error) {
      if (error instanceof PostError) throw error;

      // ✅ FUNDAÇÃO 3: Tratar erros de validação
      const { handleValidationError } = await import("@/shared/validation");
      const validationMessage = handleValidationError(error);
      if (validationMessage !== "Erro de validação desconhecido") {
        throw new PostError(validationMessage, "VALIDATION_ERROR", 400);
      }

      trackError(error as Error, {
        component: "PostService",
        action: "updatePost",
        metadata: { postId },
      });
      throw new PostError("Unexpected error updating post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Deleta um post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) {
        throw new PostError(error.message, error.code || "DELETE_FAILED");
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "deletePost",
        metadata: { postId },
      });
      throw new PostError("Unexpected error deleting post", "UNKNOWN_ERROR");
    }
  }

  // ============================================================================
  // LISTAGEM E FEED
  // ============================================================================

  /**
   * Busca posts do feed com filtros e paginação
   */
  /**
   * Busca posts do feed com expansão territorial
   * Sprint 2 - Fase 2: Refatorado para usar location_ids com expansão territorial
   */
  async getFeed(params: {
    location_id?: string;
    location_ids?: string[];
    district_filter?: boolean;
    city_filter?: boolean;
    includeStreetReach?: boolean;
    limit?: number;
    cursor?: string;
  } = {}): Promise<FeedResult> {
    try {
      const {
        location_id,
        location_ids,
        district_filter = false,
        city_filter = false,
        includeStreetReach = false,
        limit = PAGINATION.DEFAULT_LIMIT,
        cursor,
      } = params;

      // Validar que temos location_id ou location_ids
      if (!location_id && !location_ids?.length) {
        logger.warn('PostService: Empty location_ids', { params });
        return { posts: [], hasMore: false };
      }

      // Expandir território
      const expandedIds = await this.resolveFeedLocationIds({
        location_id,
        location_ids,
        district_filter,
        city_filter,
      });

      if (expandedIds.length === 0) {
        logger.warn('PostService: No valid locations after expansion', { location_id, location_ids });
        return { posts: [], hasMore: false };
      }

      // Query com JOIN em locations
      let query = supabase
        .from('posts')
        .select(`
          id,
          author_profile_id,
          content,
          type,
          location_id,
          reach,
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
        `)
        .in('location_id', expandedIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit + 1); // +1 para verificar hasMore

      if (!includeStreetReach) {
        query = query.or('reach.is.null,reach.neq.street');
      }

      // Cursor pagination
      if (cursor) {
        const decodedCursor = this.decodeCursor(cursor);
        query = query.lt('created_at', decodedCursor.created_at);
      }

      const { data: posts, error } = await query;

      if (error) {
        logger.error('PostService: Query error', {
          error: error.message,
          params,
        });
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      // Verifica se tem mais posts
      const hasMore = posts.length > limit;
      const resultPosts = hasMore ? posts.slice(0, limit) : posts;

      // Gera próximo cursor
      const nextCursor =
        hasMore && resultPosts.length > 0
          ? this.encodeCursor({
              created_at: resultPosts[resultPosts.length - 1].created_at,
            })
          : undefined;

      return {
        posts: resultPosts as Post[],
        nextCursor,
        hasMore,
      };
    } catch (error) {
      if (error instanceof PostError) throw error;
      
      logger.error('PostService: Unexpected error', {
        error: (error as Error).message,
      });
      trackError(error as Error, {
        component: "PostService",
        action: "getFeed",
        metadata: { limit: params.limit },
      });
      throw new PostError("Unexpected error fetching feed", "UNKNOWN_ERROR");
    }
  }

  /**
   * Expande location_ids para incluir territórios relacionados
   * Sprint 2 - Fase 2: Implementação de expansão territorial
   * 
   * Regras:
   * - city: retorna cidade + todos os distritos ativos filhos
   * - district: retorna bairro + cidade-pai
   */
  private async resolveFeedLocationIds(params: {
    location_id?: string;
    location_ids?: string[];
    district_filter?: boolean;
    city_filter?: boolean;
  }): Promise<string[]> {
    const { location_id, location_ids, district_filter, city_filter } = params;

    if (location_ids?.length) {
      return this.expandLocationIds(location_ids);
    }

    if (!location_id) {
      return [];
    }

    if (district_filter) {
      return [location_id];
    }

    if (city_filter) {
      const { data: districts } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', location_id)
        .eq('type', 'district')
        .eq('status', 'active');

      return [location_id, ...(districts ?? []).map((d) => d.id)];
    }

    return this.expandLocationIds([location_id]);
  }

  private async expandLocationIds(locationIds: string[]): Promise<string[]> {
    const expanded: string[] = [];

    for (const locationId of locationIds) {
      const { data: location } = await supabase
        .from('locations')
        .select('id, type, parent_id')
        .eq('id', locationId)
        .eq('status', 'active')
        .single();

      if (!location) {
        logger.warn('PostService: Location not found or inactive', {
          location_id: locationId,
        });
        continue;
      }

      // Adicionar o próprio location_id
      expanded.push(locationId);

      if (location.type === 'city') {
        // Cidade → adicionar todos os distritos ativos
        const { data: districts } = await supabase
          .from('locations')
          .select('id')
          .eq('parent_id', locationId)
          .eq('type', 'district')
          .eq('status', 'active');
        
        if (districts) {
          expanded.push(...districts.map(d => d.id));
        }
      } else if (location.type === 'district') {
        // Bairro → adicionar cidade pai
        if (location.parent_id) {
          expanded.push(location.parent_id);
        }
      }
    }

    // Remover duplicados
    return [...new Set(expanded)];
  }

  /**
   * Busca posts por profile
   */
  async getPostsByProfile(
    profileId: string,
    params: PaginationParams = {},
  ): Promise<Post[]> {
    try {
      const { limit = PAGINATION.DEFAULT_LIMIT, offset = 0 } = params;

      const { data: posts, error } = await (supabase as any)
        .from("posts")
        .select(
          `
          *,
          author_profile:profiles!author_profile_id(*)
        `,
        )
        .eq("author_profile_id", profileId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return posts || [];
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsByProfile",
        metadata: { profileId, limit: params.limit },
      });
      throw new PostError(
        "Unexpected error fetching posts by profile",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Busca posts por localização
   */
  /**
   * Busca posts salvos (delegado para SocialInteractionsService)
   */
  async getSavedPosts(
    userId: string,
    params: PaginationParams = {},
  ): Promise<Post[]> {
    try {
      const { limit = PAGINATION.DEFAULT_LIMIT, offset = 0 } = params;

      // ✅ GATE 3 FASE 3C - Usar SocialInteractionsService
      const savedPosts = await SocialInteractionsService.getSavedPosts(
        userId,
        limit,
        offset,
      );

      if (!savedPosts || savedPosts.length === 0) {
        return [];
      }

      // Buscar os posts completos
      const postIds = savedPosts.map((sp) => sp.post_id);
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
        component: "PostService",
        action: "getSavedPosts",
        metadata: { userId, limit: params.limit },
      });
      throw new PostError(
        "Unexpected error fetching saved posts",
        "UNKNOWN_ERROR",
      );
    }
  }

  // ============================================================================
  // MÉTRICAS E CONTADORES
  // ============================================================================

  /**
   * Busca estatísticas de um post
   */
  async getPostStats(postId: string): Promise<PostStats> {
    try {
      const { data: post, error } = await (supabase as any)
        .from("posts")
        .select("likes_count, comments_count")
        .eq("id", postId)
        .single();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return {
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
      };
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostStats",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error fetching post stats",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Conta posts por profile
   */
  async getPostsCountByProfile(profileId: string): Promise<number> {
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
        component: "PostService",
        action: "getPostsCountByProfile",
        metadata: { profileId },
      });
      throw new PostError("Unexpected error counting posts", "UNKNOWN_ERROR");
    }
  }

  /**
   * Conta posts por usuário (usando profile ativo)
   */
  async getPostsCountByUser(userId: string): Promise<number> {
    try {
      const activeProfile =
        await profileService.getRequiredActiveProfile(userId);
      return await this.getPostsCountByProfile(activeProfile.id);
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsCountByUser",
        metadata: { userId },
      });
      throw new PostError(
        "Unexpected error counting user posts",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Conta posts por author_profile_id
   */
  async getPostsCountByAuthor(authorProfileId: string): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_profile_id", authorProfileId);

      if (error) {
        throw new PostError(error.message, error.code || "COUNT_FAILED");
      }

      return count || 0;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsCountByAuthor",
        metadata: { authorProfileId },
      });
      throw new PostError(
        "Unexpected error counting posts by author",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Conta posts por author_profile_id criados hoje (para rate limiting)
   */
  async getPostsCountByAuthorToday(authorProfileId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await (supabase as any)
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_profile_id", authorProfileId)
        .gte("created_at", today.toISOString());

      if (error) {
        throw new PostError(error.message, error.code || "COUNT_FAILED");
      }

      return count || 0;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsCountByAuthorToday",
        metadata: { authorProfileId },
      });
      throw new PostError(
        "Unexpected error counting today posts by author",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Busca total de curtidas recebidas em posts de um author
   */
  async getPostsLikesReceivedByAuthor(
    authorProfileId: string,
  ): Promise<number> {
    try {
      const { data: posts, error } = await (supabase as any)
        .from("posts")
        .select("likes_count")
        .eq("author_profile_id", authorProfileId);

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return (posts || []).reduce(
        (sum, post) => sum + (post.likes_count || 0),
        0,
      );
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsLikesReceivedByAuthor",
        metadata: { authorProfileId },
      });
      throw new PostError(
        "Unexpected error counting likes received by author",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Busca atividade de posts de um author para timeline
   */
  async getPostActivityByAuthor(
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

      return (posts || []).map((post) => ({
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
        component: "PostService",
        action: "getPostActivityByAuthor",
        metadata: { authorProfileId, from, to },
      });
      throw new PostError(
        "Unexpected error fetching post activity by author",
        "UNKNOWN_ERROR",
      );
    }
  }

  // ============================================================================
  // VALIDAÇÕES E PERMISSÕES
  // ============================================================================

  /**
   * Valida se usuário é dono do post
   */
  async validatePostOwnership(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const post = await this.getPostById(postId);
      if (!post) return false;

      const profiles = await profileService.getProfilesByIds([
        (post as any).author_profile_id || (post as any).profile_id,
      ]);
      if (!profiles || profiles.length === 0) return false;

      return profiles[0].user_id === userId;
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "validatePostOwnership",
        metadata: { postId, userId },
      });
      return false;
    }
  }

  /**
   * Verifica se usuário pode criar post
   */
  async canUserCreatePost(userId: string): Promise<boolean> {
    try {
      const context = await profileService.getProfileContext(userId);
      if (!context) return false;

      return context.permissions.canPost;
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "canUserCreatePost",
        metadata: { userId },
      });
      return false;
    }
  }

  /**
   * Verifica se usuário pode editar post
   */
  async canUserEditPost(postId: string, userId: string): Promise<boolean> {
    try {
      const canCreate = await this.canUserCreatePost(userId);
      if (!canCreate) return false;

      return await this.validatePostOwnership(postId, userId);
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "canUserEditPost",
        metadata: { postId, userId },
      });
      return false;
    }
  }

  /**
   * Verifica se usuário pode deletar post
   */
  async canUserDeletePost(postId: string, userId: string): Promise<boolean> {
    try {
      // Mesma lógica de edição por enquanto
      return await this.canUserEditPost(postId, userId);
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "canUserDeletePost",
        metadata: { postId, userId },
      });
      return false;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Codifica cursor para paginação
   */
  private encodeCursor(data: { created_at: string }): string {
    return Buffer.from(JSON.stringify(data)).toString("base64");
  }

  /**
   * Decodifica cursor de paginação
   */
  private decodeCursor(cursor: string): { created_at: string } {
    try {
      return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
    } catch {
      throw new PostError("Invalid cursor", "INVALID_CURSOR", 400);
    }
  }

  // ============================================================================
  // POLLS
  // ============================================================================

  /**
   * Cria uma enquete vinculada a um post
   */
  async createPoll(data: CreatePollData): Promise<Poll> {
    try {
      // Validações
      if (!data.question || data.question.trim().length < 10) {
        throw new PostError(
          "Pergunta deve ter no mínimo 10 caracteres",
          "INVALID_QUESTION",
          400,
        );
      }

      if (data.options.length < 2) {
        throw new PostError(
          "Enquete deve ter no mínimo 2 opções",
          "INVALID_OPTIONS",
          400,
        );
      }

      if (data.options.length > 6) {
        throw new PostError(
          "Enquete pode ter no máximo 6 opções",
          "INVALID_OPTIONS",
          400,
        );
      }

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

      // 1. Criar poll
      const { data: poll, error: pollError } = await (supabase as any)
        .from("community_polls")
        .insert({
          post_id: data.postId,
          question: data.question,
          expires_at: expiresAt.toISOString(),
          options: [], // Campo obrigatório na tabela
        })
        .select()
        .single();

      if (pollError) {
        throw new PostError(
          `Erro ao criar enquete: ${pollError.message}`,
          pollError.code || "CREATE_FAILED",
        );
      }

      // 2. Criar opções
      const optionsToInsert = data.options.map((opt) => ({
        poll_id: poll.id,
        text: opt.text,
        position: opt.position,
      }));

      const { data: createdOptions, error: optionsError } = await (
        supabase as any
      )
        .from("community_poll_options")
        .insert(optionsToInsert)
        .select();

      if (optionsError) {
        // Rollback: delete poll se opções falharem
        await (supabase as any)
          .from("community_polls")
          .delete()
          .eq("id", poll.id);
        throw new PostError(
          `Erro ao criar opções: ${optionsError.message}`,
          optionsError.code || "CREATE_OPTIONS_FAILED",
        );
      }

      // 3. Atualizar campo options na poll com as opções criadas
      const optionsForPoll = createdOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        votes: 0,
        position: opt.position,
      }));

      const { error: updateError } = await (supabase as any)
        .from("community_polls")
        .update({ options: optionsForPoll })
        .eq("id", poll.id);

      if (updateError) {
        trackError(updateError as Error, {
          component: "PostService",
          action: "createPoll",
          metadata: { pollId: poll.id, step: "update_options" },
        });
      }

      return {
        ...poll,
        options: optionsForPoll,
      };
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "createPoll",
        metadata: { postId: data.postId, question: data.question },
      });
      throw new PostError("Unexpected error creating poll", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca uma enquete por ID
   */
  async getPollById(pollId: string): Promise<Poll | null> {
    try {
      const { data: poll, error } = await (supabase as any)
        .from("community_polls")
        .select("*")
        .eq("id", pollId)
        .maybeSingle();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return poll;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPollById",
        metadata: { pollId },
      });
      throw new PostError("Unexpected error fetching poll", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca enquete por post ID
   */
  async getPollByPostId(postId: string): Promise<Poll | null> {
    try {
      const { data: poll, error } = await (supabase as any)
        .from("community_polls")
        .select("*")
        .eq("post_id", postId)
        .maybeSingle();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return poll;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPollByPostId",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error fetching poll by post",
        "UNKNOWN_ERROR",
      );
    }
  }

  // ============================================================================
  // ============================================================================
  // STORAGE E UTILITÁRIOS
  // ============================================================================

  /**
   * Upload de imagens para posts
   */
  async uploadPostImages(profileId: string, images: File[]): Promise<string[]> {
    try {
      const urls: string[] = [];

      for (const image of images) {
        const upload = await mediaService.uploadPostImage(profileId, image, { preset: "post_image" });
        urls.push(upload.url);
      }

      return urls;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "uploadPostImages",
        metadata: { profileId, imageCount: images.length },
      });
      throw new PostError("Unexpected error uploading images", "UNKNOWN_ERROR");
    }
  }

  /**
   * Adiciona pontos ao usuário (delegado para gamificação)
   */
  async addUserPoints(
    userId: string,
    action: string,
    points: number,
  ): Promise<void> {
    try {
      const { error } = await (supabase as any).rpc("add_pontos", {
        _user_id: userId,
        _acao: action,
        _pontos: points,
      });

      if (error) {
        throw new PostError(error.message, error.code || "ADD_POINTS_FAILED");
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "addUserPoints",
        metadata: { userId, action, points },
      });
      throw new PostError(
        "Unexpected error adding user points",
        "UNKNOWN_ERROR",
      );
    }
  }

  // ============================================================================
  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Busca informações básicas de um post (para notificações e ações)
   */
  async getPostBasicInfo(
    postId: string,
  ): Promise<{ author_profile_id: string; title?: string } | null> {
    try {
      const { data: post, error } = await (supabase as any)
        .from("posts")
        .select("author_profile_id, title")
        .eq("id", postId)
        .maybeSingle();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return post;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostBasicInfo",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error fetching post basic info",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Busca apenas o author_profile_id de um post
   */
  async getPostAuthorId(postId: string): Promise<string | null> {
    try {
      const { data: post, error } = await (supabase as any)
        .from("posts")
        .select("author_profile_id")
        .eq("id", postId)
        .maybeSingle();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return post?.author_profile_id || null;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostAuthorId",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error fetching post author",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Deleta um post (com verificação de ownership)
   */
  async deletePostByAuthor(
    postId: string,
    authorProfileId: string,
  ): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_profile_id", authorProfileId);

      if (error) {
        throw new PostError(error.message, error.code || "DELETE_FAILED");
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "deletePostByAuthor",
        metadata: { postId, authorProfileId },
      });
      throw new PostError("Unexpected error deleting post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Incrementa reputação do usuário via RPC
   */
  async incrementUserReputation(userId: string, points: number): Promise<void> {
    try {
      const { error } = await (supabase as any).rpc(
        "increment_user_reputation",
        {
          user_id: userId,
          points: points,
        },
      );

      if (error) {
        throw new PostError(
          error.message,
          error.code || "REPUTATION_UPDATE_FAILED",
        );
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "incrementUserReputation",
        metadata: { userId, points },
      });
      throw new PostError(
        "Unexpected error updating reputation",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Verifica se um post existe
   */
  async postExists(postId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any)
        .from("posts")
        .select("id")
        .eq("id", postId)
        .maybeSingle();

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return !!data;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "postExists",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error checking post existence",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Incrementa contador de compartilhamentos de um post
   */
  async incrementSharesCount(postId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("posts")
        .update({
          shares_count: (supabase as any).rpc("increment", { x: 1 }),
        })
        .eq("id", postId);

      if (error) {
        throw new PostError(error.message, error.code || "UPDATE_FAILED");
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "incrementSharesCount",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error incrementing shares count",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Registra voto em uma enquete
   */
  async votePoll(
    pollId: string,
    userId: string,
    optionId: string,
  ): Promise<void> {
    try {
      // Registrar voto (falhará se já existir devido à constraint UNIQUE)
      const { error: voteError } = await (supabase as any)
        .from("community_poll_votes")
        .insert({
          poll_id: pollId,
          user_id: userId,
          option_id: optionId,
        });

      if (voteError) {
        // Se for erro de conflito (409), significa que já votou
        if (voteError.code === "23505") {
          throw new PostError(
            "Você já votou nesta enquete",
            "ALREADY_VOTED",
            409,
          );
        }
        throw new PostError(voteError.message, voteError.code || "VOTE_FAILED");
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "votePoll",
        metadata: { pollId, userId, optionId },
      });
      throw new PostError("Unexpected error voting in poll", "UNKNOWN_ERROR");
    }
  }

  /**
   * Atualiza contadores de uma enquete após voto
   */
  async updatePollVoteCounts(
    pollId: string,
    optionId: string,
  ): Promise<{ options: any[]; total_votes: number }> {
    try {
      // Buscar enquete atual
      const poll = await this.getPollById(pollId);
      if (!poll) {
        throw new PostError("Poll not found", "NOT_FOUND", 404);
      }

      // Atualizar opções com contagem de votos
      const options = poll.options;
      const updatedOptions = options.map((opt) => {
        if (opt.id === optionId) {
          const newVotes = (opt.votes || 0) + 1;
          return { ...opt, votes: newVotes };
        }
        return opt;
      });

      const newTotalVotes = poll.total_votes + 1;

      // Atualizar total de votos
      const { error: updateError } = await (supabase as any)
        .from("community_polls")
        .update({
          options: updatedOptions,
          total_votes: newTotalVotes,
        })
        .eq("id", pollId);

      if (updateError) {
        throw new PostError(
          updateError.message,
          updateError.code || "UPDATE_FAILED",
        );
      }

      return {
        options: updatedOptions,
        total_votes: newTotalVotes,
      };
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "updatePollVoteCounts",
        metadata: { pollId, optionId },
      });
      throw new PostError(
        "Unexpected error updating poll vote counts",
        "UNKNOWN_ERROR",
      );
    }
  }

  // ============================================================================
  // MODERAÇÃO
  // ============================================================================

  /**
   * Remove um post (moderação)
   */
  async removePost(
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
        component: "PostService",
        action: "removePost",
        metadata: { postId, reason, moderatorProfileId: moderatorProfileId },
      });
      throw new PostError("Unexpected error removing post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Oculta um post (moderação)
   */
  async hidePost(postId: string): Promise<void> {
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
        component: "PostService",
        action: "hidePost",
        metadata: { postId },
      });
      throw new PostError("Unexpected error hiding post", "UNKNOWN_ERROR");
    }
  }

  // ============================================================================
  // WIDGETS E ANALYTICS
  // ============================================================================

  /**
   * Busca alertas ativos com confirmações
   */
  async getActiveAlerts(
    locationId: string,
    limit: number = 5,
  ): Promise<
    Array<{
      id: string;
      content: string;
      confirmations_count: number;
      is_verified: boolean;
    }>
  > {
    try {
      const { data, error } = await (supabase as any)
        .from("posts")
        .select("id, content, confirmations_count, is_verified")
        .eq("type", "alerta")
        .eq("location_id", locationId)
        .gte("confirmations_count", 2)
        .order("confirmations_count", { ascending: false })
        .limit(limit);

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return data || [];
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getActiveAlerts",
        metadata: { locationId, limit },
      });
      throw new PostError(
        "Unexpected error fetching active alerts",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Busca tags populares dos últimos 7 dias
   */
  async getPopularTags(
    locationId: string,
    limit: number = PAGINATION.SMALL_LIMIT,
  ): Promise<
    Array<{
      tag: string;
      count: number;
    }>
  > {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await (supabase as any)
        .from("posts")
        .select("tags")
        .eq("location_id", locationId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      // Contar tags
      const tagCounts = new Map<string, number>();
      (data || []).forEach((post: any) => {
        (post.tags || []).forEach((tag: string) => {
          const currentCount = tagCounts.get(tag) ?? 0;
          tagCounts.set(tag, currentCount + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPopularTags",
        metadata: { locationId, limit },
      });
      throw new PostError(
        "Unexpected error fetching popular tags",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Busca posts em alta (top engagement dos últimos 7 dias)
   */
  async getTopPosts(
    locationId: string,
    limit: number = 5,
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

      const { data, error } = await (supabase as any)
        .from("posts")
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
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("likes_count", { ascending: false })
        .limit(limit);

      if (error) {
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      }

      return (data || []).map((post: any) => ({
        id: post.id,
        content:
          post.content.substring(0, 100) +
          (post.content.length > 100 ? "..." : ""),
        author_name: post.author?.name || "Usuário",
        engagement: (post.likes_count || 0) + (post.comments_count || 0),
      }));
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getTopPosts",
        metadata: { locationId, limit },
      });
      throw new PostError(
        "Unexpected error fetching top posts",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Confirma um alerta e aplica lógica de verificação automática
   * ✅ SSOT - Usa counter no post, não tabela separada
   */
  async confirmAlert(
    postId: string,
    userId: string,
    authorProfileId: string,
  ): Promise<{
    confirmationsCount: number;
    isVerified: boolean;
  }> {
    try {
      // Incrementa o contador de confirmações diretamente no post
      const { data: post, error: updateError } = await (supabase as any)
        .from("posts")
        .select("confirmations_count, is_verified")
        .eq("id", postId)
        .single();

      if (updateError) {
        throw new PostError(
          updateError.message,
          updateError.code || "FETCH_FAILED",
        );
      }

      // Incrementa o contador
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
        throw new PostError(
          confirmError.message,
          confirmError.code || "CONFIRM_FAILED",
        );
      }

      // Se atingiu 5 confirmações, incrementa reputação do autor
      if (shouldVerify && !post.is_verified) {
        await this.incrementUserReputation(authorProfileId, 5);
      }

      return { confirmationsCount: newCount, isVerified: shouldVerify || post.is_verified };
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "confirmAlert",
        metadata: { postId, userId },
      });
      throw new PostError("Unexpected error confirming alert", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca interações do usuário com um post (likes, saves, confirmações, voto em enquete)
   */
  async getPostUserInteractions(
    postId: string,
    userId: string,
    postType?: string,
  ): Promise<{
    isLiked: boolean;
    isSaved: boolean;
    hasConfirmed: boolean;
    pollVoteOptionId: string | null;
  }> {
    try {
      // Resolver profile_id a partir do user_id via ProfileService (SSOT)
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

      // ✅ SSOT - Confirmações são rastreadas por contador, não por tabela
      // Não podemos saber se um usuário específico confirmou
      const hasConfirmed = false;

      // Buscar voto em enquete se existir
      let pollVoteOptionId: string | null = null;
      const poll = await this.getPollByPostId(postId);
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
        component: "PostService",
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

  /**
   * Busca menções de um post
   */
  async getPostMentions(postId: string): Promise<
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
        component: "PostService",
        action: "getPostMentions",
        metadata: { postId },
      });
      return [];
    }
  }

  /**
   * Cria notificação de like para o autor do post
   */
  async createLikeNotification(postId: string, likerId: string): Promise<void> {
    try {
      const postInfo = await this.getPostBasicInfo(postId);
      if (!postInfo || postInfo.author_profile_id === likerId) return;

      await notificationService.createNotification({
        user_id: postInfo.author_profile_id,
        type: NotificationType.POST_LIKE,
        title: "Novo like no seu post",
        message: `Alguem curtiu seu post: ${postInfo.title?.substring(0, 50) ?? ""}...`,
        priority: "low",
        metadata: { post_id: postId, liker_id: likerId },
      });
    } catch (error) {
      // Notificação é best-effort, não propagar erro
      trackError(error as Error, {
        component: "PostService",
        action: "createLikeNotification",
        metadata: { postId, likerId },
      });
    }
  }

  /**
   * Busca os IDs de perfis que seguem um post.
   */
  async getFollowedPostUserIds(postId: string): Promise<string[]> {
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
        component: "PostService",
        action: "getFollowedPostUserIds",
        metadata: { postId },
      });
      throw new PostError(
        "Unexpected error fetching post followers",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Verifica e alterna o follow de um post
   */
  async toggleFollowPost(
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
        if (error)
          throw new PostError(error.message, error.code || "UNFOLLOW_FAILED");
        return { action: "unfollow" };
      } else {
        const { error } = await (supabase as any)
          .from("followed_posts")
          .insert({ post_id: postId, user_id: userId });
        if (error)
          throw new PostError(error.message, error.code || "FOLLOW_FAILED");
        return { action: "follow" };
      }
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "toggleFollowPost",
        metadata: { postId, userId },
      });
      throw new PostError("Unexpected error toggling follow", "UNKNOWN_ERROR");
    }
  }
  // ============================================================================
  // ============================================================================
  // MÉTODOS CANÔNICOS
  // ============================================================================

  /**
   * Busca posts por tipo com filtros opcionais (ex: 'ride_share')
   * Canonical boundary para useCommunityPosts e similares
   */
  async getPostsByType(
    type: string,
    filters?: { search?: string },
  ): Promise<Post[]> {
    try {
      let query = (supabase as any)
        .from("posts")
        .select("*")
        .eq("type", type)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        query = query.ilike("content", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error)
        throw new PostError(error.message, error.code || "FETCH_FAILED");
      return data || [];
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsByType",
        metadata: { type, filters },
      });
      throw new PostError(
        "Unexpected error fetching posts by type",
        "UNKNOWN_ERROR",
      );
    }
  }

  /**
   * Upload de imagem para o bucket 'posts' e retorno da URL pública.
   *
   * Canonical boundary: todo acesso ao storage bucket 'posts' deve passar por aqui.
   * Nenhum modulo externo deve acessar storage de posts diretamente.
   *
   * Path: posts/{profileId}/{fileName}
   * Motivo do profileId no path:
   *   - Isola arquivos por profile (não por user_id), alinhado com o modelo SSOT
   *     onde a identidade de atuação social é o profile ativo, não o auth user.
   *   - Permite RLS policies no storage baseadas em profile ownership.
   *   - Evita colisão de nomes entre profiles diferentes do mesmo user.
   *
   * @param profileId - ID do profile ativo (author_profile_id), não o auth user.id
   * @param file - Arquivo de imagem já validado e otimizado pelo chamador
   * @param fileName - Nome do arquivo (ex: `${Date.now()}.jpg`) — sem path prefix
   * @returns URL pública permanente da imagem no CDN
   */
  async uploadPostImage(
    profileId: string,
    file: File,
    fileName: string,
  ): Promise<string> {
    try {
      const upload = await mediaService.uploadToBucket(file, {
        bucket: "posts",
        pathPrefix: `posts/${profileId}`,
        fileName,
        preset: "post_image",
        upsert: false,
      });
      return upload.url;
    } catch (error) {
      if (error instanceof PostError) throw error;
      trackError(error as Error, {
        component: "PostService",
        action: "uploadPostImage",
        metadata: { profileId, fileName },
      });
      throw new PostError(
        "Unexpected error uploading post image",
        "UNKNOWN_ERROR",
      );
    }
  }

  // ============================================================================
  // 📊 ESTATÍSTICAS ADMINISTRATIVAS
  // ============================================================================

  /**
   * 📊 OBTER CONTAGEM TOTAL DE POSTS
   * ✅ SSOT para contagem de posts no dashboard admin
   *
   * @returns Número total de posts cadastrados
   */
  async getTotalPostsCount(): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from("posts")
        .select("*", { count: "exact", head: true });

      if (error) {
        trackError(error, {
          component: "PostService",
          action: "getTotalPostsCount",
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "getTotalPostsCount",
      });
      return 0;
    }
  }

  /**
   * 📋 OBTER POSTS RECENTES
   * ✅ SSOT para atividade recente de posts
   *
   * @param limit - Número máximo de resultados (padrão: 10)
   * @returns Lista de posts recentes
   */
  async getRecentPosts(limit = PAGINATION.SMALL_LIMIT): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("posts")
        .select("id, content, author_profile_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        trackError(error, {
          component: "PostService",
          action: "getRecentPosts",
          metadata: { limit },
        });
        return [];
      }

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "getRecentPosts",
      });
      return [];
    }
  }

  /**
   * 📅 OBTER POSTS CRIADOS EM UM PERÍODO
   * ✅ SSOT para atividade de posts por período
   *
   * @param startDate - Data inicial do período
   * @param endDate - Data final do período
   * @returns Número de posts criados no período
   */
  async getPostsCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) {
        trackError(error, {
          component: "PostService",
          action: "getPostsCreatedInPeriod",
          metadata: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        });
        return 0;
      }

      return count || 0;
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsCreatedInPeriod",
      });
      return 0;
    }
  }
  /**
   * 📸 OBTER POSTS COM IMAGENS POR LOCALIZAÇÃO
   * ✅ SSOT para fotos da comunidade em pontos turísticos e páginas de localização
   *
   * @param options - Filtros de localização
   * @returns Lista de posts com imagens e dados do autor
   */
  async getPostsWithImages(options: {
    locationId?: string | null;
    locationIds?: string[];
    city?: string;
    neighborhood?: string;
    state?: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    image_url: string;
    content: string;
    author_name: string;
    author_avatar: string | null;
    created_at: string;
  }>> {
    try {
      let query = (supabase as any)
        .from("posts")
        .select(`
          id,
          image_url,
          content,
          created_at,
          author_profile:profiles!author_profile_id(display_name, avatar_url)
        `)
        .eq("is_published", true)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(options.limit ?? 12);

      if (options.locationId) {
        query = query.eq("location_id", options.locationId);
      } else if (options.locationIds?.length) {
        query = query.in("location_id", options.locationIds);
      } else if (options.city && options.state) {
        const cityResolution = await resolveCityToLocationIds(options.state, options.city);
        if (cityResolution?.districtIds?.length) {
          if (options.neighborhood) {
            const neighborhoodId = await resolveNeighborhoodInCity(
              options.state,
              options.city,
              options.neighborhood,
            );
            if (neighborhoodId) {
              query = query.eq("location_id", neighborhoodId);
            } else {
              return [];
            }
          } else {
            query = query.in("location_id", cityResolution.districtIds);
          }
        } else {
          return [];
        }
      } else if (options.city || options.neighborhood) {
        return [];
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return mapPostsWithImagesRows(data as Array<{
        id: string;
        image_url: string;
        content?: string | null;
        created_at: string;
        author_profile?: {
          display_name?: string | null;
          avatar_url?: string | null;
        } | null;
      }>);
    } catch (error) {
      trackError(error as Error, {
        component: "PostService",
        action: "getPostsWithImages",
      });
      return [];
    }
  }
}

export const postService = new PostService();
