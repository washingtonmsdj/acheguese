import * as queries from "./posts.queries";
import * as mutations from "./posts.mutations";
import * as pollMutations from "./polls.mutations";
import * as pollQueries from "./polls.queries";
import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import { mediaService } from "@/core/media/services/MediaService";
import { LocationType } from "@/shared/types/enums";
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
  // CRUD BASICO
  // ============================================================================

  /**
   * Cria um novo post
   */
  /**
   * Cria um novo post com SSOT territorial
   * Sprint 2 - Fase 2: Refatorado para usar location_id obrigatorio
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
    const territoryPolicy = {
      allowedLocationTypes: [LocationType.CITY, LocationType.DISTRICT, LocationType.NEIGHBORHOOD],
      invalidLocationTypeCode: "INVALID_LOCATION_TYPE",
    } as const;

    return mutations.createPost(data, territoryPolicy);
  }

  /**
   * Busca um post especifico por ID
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
   * Busca posts do feed com filtros e paginacao
   */
  /**
   * Busca posts do feed com expansao territorial
   * Sprint 2 - Fase 2: Refatorado para usar location_ids com expansao territorial
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
   * Busca posts por localizacao
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
  // METRICAS E CONTADORES
  // ============================================================================

  /**
   * Busca estatisticas de um post
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
   * Conta posts por usuario (usando profile ativo)
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
  // VALIDACOES E PERMISSOES
  // ============================================================================

  /**
   * Valida se usuario e dono do post
   */
  async validatePostOwnership(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    return queries.validatePostOwnership(postId, userId);
  }

  /**
   * Verifica se usuario pode criar post
   */
  async canUserCreatePost(userId: string): Promise<boolean> {
    return queries.canUserCreatePost(userId);
  }

  /**
   * Verifica se usuario pode editar post
   */
  async canUserEditPost(postId: string, userId: string): Promise<boolean> {
    return queries.canUserEditPost(postId, userId);
  }

  /**
   * Verifica se usuario pode deletar post
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
  // STORAGE E UTILITARIOS
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
   * Adiciona pontos ao usuario (delegado para gamificacao)
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
  // METODOS AUXILIARES
  // ============================================================================

  /**
   * Busca informacoes basicas de um post (para notificacoes e acoes)
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
   * Deleta um post (com verificacao de ownership)
   */
  async deletePostByAuthor(
    postId: string,
    authorProfileId: string,
  ): Promise<void> {
    await mutations.deletePostByAuthor(postId, authorProfileId);
  }

  /**
   * Incrementa reputacao do usuario via RPC
   */
  async incrementUserReputation(userId: string, points: number): Promise<void> {
    await mutations.incrementUserReputation(userId, points);
  }

  /**
   * Verifica se um post existe
   */
  async postExists(postId: string): Promise<boolean> {
    try {
      return Boolean(await queries.getPostBasicInfo(postId));
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
   * Atualiza contadores de uma enquete apos voto
   */
  async updatePollVoteCounts(
    pollId: string,
    optionId: string,
  ): Promise<{ options: any[]; total_votes: number }> {
    return pollMutations.updatePollVoteCounts(pollId, optionId);
  }

  // ============================================================================
  // MODERACAO
  // ============================================================================

  /**
   * Remove um post (moderacao)
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
   * Oculta um post (moderacao)
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
   * Busca alertas ativos com confirmacoes
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
   * Busca tags populares dos ultimos 7 dias
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
   * Busca posts em alta (top engagement dos ultimos 7 dias)
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
   * Confirma um alerta e aplica logica de verificacao automatica.
   * SSOT - Usa counter no post, nao tabela separada.
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
   * Busca interacoes do usuario com um post (likes, saves, confirmacoes, voto em enquete)
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
   * Busca mencoes de um post
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
   * Cria notificacao de like para o autor do post
   */
  async createLikeNotification(postId: string, likerId: string): Promise<void> {
    try {
      await mutations.createLikeNotification(postId, likerId);
    } catch (error) {
      // Notificacao e best-effort, nao propagar erro
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
  // METODOS CANONICOS
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
   * Upload de imagem para o bucket 'posts' e retorno da URL publica.
   *
   * Canonical boundary: todo acesso ao storage bucket 'posts' deve passar por aqui.
   * Nenhum modulo externo deve acessar storage de posts diretamente.
   *
   * Path: posts/{profileId}/{fileName}
   * Motivo do profileId no path:
   *   - Isola arquivos por profile (nao por user_id), alinhado com o modelo SSOT
   *     onde a identidade de atuacao social e o profile ativo, nao o auth user.
   *   - Permite RLS policies no storage baseadas em profile ownership.
   *   - Evita colisao de nomes entre profiles diferentes do mesmo user.
   *
   * @param profileId - ID do profile ativo (author_profile_id), nao o auth user.id
   * @param file - Arquivo de imagem ja validado e otimizado pelo chamador
   * @param fileName - Nome do arquivo (ex: `${Date.now()}.jpg`) — sem path prefix
   * @returns URL publica permanente da imagem no CDN
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
  // ESTATISTICAS ADMINISTRATIVAS
  // ============================================================================

  /**
   * Obter contagem total de posts.
   * SSOT para contagem de posts no dashboard admin.
   *
   * @returns Numero total de posts cadastrados
   */
  async getTotalPostsCount(): Promise<number> {
    return queries.getTotalPostsCount();
  }

  /**
   * Obter posts recentes.
   * SSOT para atividade recente de posts.
   *
   * @param limit - Numero maximo de resultados (padrao: 10)
   * @returns Lista de posts recentes
   */
  async getRecentPosts(limit = PAGINATION.SMALL_LIMIT): Promise<any[]> {
    return queries.getRecentPosts(limit);
  }

  /**
   * Obter posts criados em um periodo.
   * SSOT para atividade de posts por periodo.
   *
   * @param startDate - Data inicial do periodo
   * @param endDate - Data final do periodo
   * @returns Numero de posts criados no periodo
   */
  async getPostsCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return queries.getPostsCreatedInPeriod(startDate, endDate);
  }
  /**
   * Obter posts com imagens por localizacao.
   * SSOT para fotos da comunidade em pontos turisticos e paginas de localizacao.
   *
   * @param options - Filtros de localizacao
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
