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
  getPostsCreatedInPeriod,
  getPostsWithImages,
  getActiveAlerts,
  getSavedPosts,
  getPostsCountByProfile,
  getPostsCountByUser,
  getPostActivityByAuthor,
  validatePostOwnership,
  canUserCreatePost,
  canUserEditPost,
  canUserDeletePost,
  getPostUserInteractions,
  getPostMentions,
  getFollowedPostUserIds,
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
  toggleFollowPost,
  createLikeNotification,
  removePost,
  hidePost,
  confirmAlert,
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
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import { mediaService } from "@/core/media/services/MediaService";
import type {
  Post,
  FeedResult,
  UpdatePostData,
  PostStats,
  PaginationParams,
  Poll,
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
    return mutations.createPost(data);
  }

  /**
   * Busca um post específico por ID
   */
  async getPostById(postId: string): Promise<Post | null> {
    return queries.getPostById(postId);
  }

  /**
   * Atualiza um post
   */
  async updatePost(postId: string, data: UpdatePostData): Promise<Post> {
    return mutations.updatePost(postId, data);
  }

  /**
   * Deleta um post
   */
  async deletePost(postId: string): Promise<void> {
    await mutations.deletePost(postId);
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
    return queries.getTerritorialFeed(params);
  }

  /**
   * Busca posts por profile
   */
  async getPostsByProfile(
    profileId: string,
    params: PaginationParams = {},
  ): Promise<Post[]> {
    return queries.getPostsByProfile(profileId, params);
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
    return queries.getSavedPosts(userId, params);
  }

  // ============================================================================
  // MÉTRICAS E CONTADORES
  // ============================================================================

  /**
   * Busca estatísticas de um post
   */
  async getPostStats(postId: string): Promise<PostStats> {
    return queries.getPostStats(postId);
  }

  /**
   * Conta posts por profile
   */
  async getPostsCountByProfile(profileId: string): Promise<number> {
    return queries.getPostsCountByProfile(profileId);
  }

  /**
   * Conta posts por usuário (usando profile ativo)
   */
  async getPostsCountByUser(userId: string): Promise<number> {
    return queries.getPostsCountByUser(userId);
  }

  /**
   * Conta posts por author_profile_id
   */
  async getPostsCountByAuthor(authorProfileId: string): Promise<number> {
    return queries.getPostsCountByAuthor(authorProfileId);
  }

  /**
   * Conta posts por author_profile_id criados hoje (para rate limiting)
   */
  async getPostsCountByAuthorToday(authorProfileId: string): Promise<number> {
    return queries.getPostsCountByAuthorToday(authorProfileId);
  }

  /**
   * Busca total de curtidas recebidas em posts de um author
   */
  async getPostsLikesReceivedByAuthor(
    authorProfileId: string,
  ): Promise<number> {
    return queries.getPostsLikesReceivedByAuthor(authorProfileId);
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
    return queries.getPostActivityByAuthor(authorProfileId, from, to);
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
    return queries.validatePostOwnership(postId, userId);
  }

  /**
   * Verifica se usuário pode criar post
   */
  async canUserCreatePost(userId: string): Promise<boolean> {
    return queries.canUserCreatePost(userId);
  }

  /**
   * Verifica se usuário pode editar post
   */
  async canUserEditPost(postId: string, userId: string): Promise<boolean> {
    return queries.canUserEditPost(postId, userId);
  }

  /**
   * Verifica se usuário pode deletar post
   */
  async canUserDeletePost(postId: string, userId: string): Promise<boolean> {
    return queries.canUserDeletePost(postId, userId);
  }
  // POLLS
  // ============================================================================

  /**
   * Cria uma enquete vinculada a um post
   */
  async createPoll(data: CreatePollData): Promise<Poll> {
    return pollMutations.createPoll(data);
  }

  /**
   * Busca uma enquete por ID
   */
  async getPollById(pollId: string): Promise<Poll | null> {
    return pollQueries.getPollById(pollId);
  }

  /**
   * Busca enquete por post ID
   */
  async getPollByPostId(postId: string): Promise<Poll | null> {
    return pollQueries.getPollByPostId(postId);
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
    return queries.getPostBasicInfo(postId);
  }

  /**
   * Busca apenas o author_profile_id de um post
   */
  async getPostAuthorId(postId: string): Promise<string | null> {
    return queries.getPostAuthorId(postId);
  }

  /**
   * Deleta um post (com verificação de ownership)
   */
  async deletePostByAuthor(
    postId: string,
    authorProfileId: string,
  ): Promise<void> {
    await mutations.deletePostByAuthor(postId, authorProfileId);
  }

  /**
   * Incrementa reputação do usuário via RPC
   */
  async incrementUserReputation(userId: string, points: number): Promise<void> {
    await mutations.incrementUserReputation(userId, points);
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
    await mutations.incrementSharesCount(postId);
  }

  /**
   * Registra voto em uma enquete
   */
  async votePoll(
    pollId: string,
    userId: string,
    optionId: string,
  ): Promise<void> {
    await pollMutations.votePoll(pollId, optionId, userId);
  }

  /**
   * Atualiza contadores de uma enquete após voto
   */
  async updatePollVoteCounts(
    pollId: string,
    optionId: string,
  ): Promise<{ options: any[]; total_votes: number }> {
    return pollMutations.updatePollVoteCounts(pollId, optionId);
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
      await mutations.removePost(postId, reason, moderatorProfileId);
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
      await mutations.hidePost(postId);
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
    return queries.getActiveAlerts(locationId, limit);
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
    return queries.getPopularTags(locationId, limit);
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
    return queries.getTopPosts(locationId, limit);
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
    return mutations.confirmAlert(postId, userId, authorProfileId);
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
      void postType;
      return queries.getPostUserInteractions(postId, userId);
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
      return queries.getPostMentions(postId);
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
      await mutations.createLikeNotification(postId, likerId);
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
      return queries.getFollowedPostUserIds(postId);
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
      return mutations.toggleFollowPost(postId, userId);
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
    return queries.getPostsByType(type, filters);
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
    return queries.getTotalPostsCount();
  }

  /**
   * 📋 OBTER POSTS RECENTES
   * ✅ SSOT para atividade recente de posts
   *
   * @param limit - Número máximo de resultados (padrão: 10)
   * @returns Lista de posts recentes
   */
  async getRecentPosts(limit = PAGINATION.SMALL_LIMIT): Promise<any[]> {
    return queries.getRecentPosts(limit);
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
    return queries.getPostsCreatedInPeriod(startDate, endDate);
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
    return queries.getPostsWithImages(options);
  }
}

export const postService = new PostService();
