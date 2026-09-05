import * as queries from "./posts.queries";
import * as mutations from "./posts.mutations";
import * as pollMutations from "./polls.mutations";
import type { CreatePollPostCommand } from "./polls.mutations";
import * as pollQueries from "./polls.queries";
import { trackError } from "@/shared/utils/errorTracking";
import { PAGINATION } from "@/shared/constants";
import { POST_LIMITS } from "@/shared/constants/socialContent";
import { mediaService } from "@/core/media/services/MediaService";
import { LocationType } from "@/shared/types/enums";
import type { TerritoryFilter } from "@/core/location/types";
import type {
  Post,
  FeedParams,
  FeedResult,
  UpdatePostData,
  PostStats,
  PaginationParams,
  Poll,
  PostType,
} from "../types";
import { PostError } from "../types";

export interface CreatePostInput {
  author_profile_id: string;
  content: string;
  type: PostType;
  location_id: string;
  reach?: "street" | "neighborhood" | "city";
  images?: string[];
  tags?: string[];
  content_intent?: string;
  display_format?: string;
  distribution_channels?: string[];
  content_payload?: Record<string, unknown>;
}

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
  async createPost(data: CreatePostInput): Promise<Post> {
    const territoryPolicy = {
      allowedLocationTypes: [
        LocationType.CITY,
        LocationType.DISTRICT,
        LocationType.NEIGHBORHOOD,
      ],
      invalidLocationTypeCode: "INVALID_LOCATION_TYPE",
    } as const;

    return mutations.createPost(data, territoryPolicy);
  }

  /**
   * Uploads canonical MediaAssets and persists their references on the post.
   * Unattached uploads are reclaimed by the bounded orphan worker.
   */
  async createPostWithImages(
    data: Omit<CreatePostInput, "images">,
    imageFiles: File[],
  ): Promise<Post> {
    if (imageFiles.length > POST_LIMITS.MAX_IMAGES) {
      throw new PostError(
        `Maximo de ${POST_LIMITS.MAX_IMAGES} imagens permitidas`,
        "TOO_MANY_IMAGES",
      );
    }

    const references: string[] = [];
    for (const imageFile of imageFiles) {
      const asset = await mediaService.uploadMediaAsset(
        data.author_profile_id,
        imageFile,
        "post_image",
      );
      references.push(asset.reference);
    }

    return this.createPost({ ...data, images: references });
  }

  /** Creates Post + Poll + Options through one database transaction. */
  async createPollPostWithImages(
    data: Omit<CreatePollPostCommand, "images">,
    imageFiles: File[],
  ): Promise<Post> {
    if (imageFiles.length > POST_LIMITS.MAX_IMAGES) {
      throw new PostError(
        `Maximo de ${POST_LIMITS.MAX_IMAGES} imagens permitidas`,
        "TOO_MANY_IMAGES",
      );
    }

    const references: string[] = [];
    for (const imageFile of imageFiles) {
      const asset = await mediaService.uploadMediaAsset(
        data.author_profile_id,
        imageFile,
        "post_image",
      );
      references.push(asset.reference);
    }

    return pollMutations.createPostWithPoll({ ...data, images: references });
  }

  /**
   * Busca um post especifico por ID
   */
  async getPostById(postId: string): Promise<Post | null> {
    return queries.getPostById(postId);
  }

  /**
   * Busca detalhe publico apenas dentro do territorio resolvido.
   */
  async getPublicPostById(
    postId: string,
    territoryFilter: TerritoryFilter,
  ): Promise<Post | null> {
    return queries.getPublicPostById(postId, territoryFilter);
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
  async getFeed(params: FeedParams = {}): Promise<FeedResult> {
    return queries.getFeed(params);
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
   * Busca posts salvos pelo owner canonico de engagement
   */
  async getSavedPosts(params: PaginationParams = {}): Promise<Post[]> {
    return queries.getSavedPosts(params);
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
   * Records one idempotent authenticated share event.
   */
  async recordPostShare(postId: string): Promise<void> {
    await mutations.recordPostShare(postId);
  }

  /**
   * Registra voto em uma enquete
   */
  async votePoll(
    pollId: string,
    optionId: string,
    profileId: string,
  ): Promise<Poll> {
    return pollMutations.votePoll(pollId, optionId, profileId);
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
      };
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
  }): Promise<
    Array<{
      id: string;
      image_url: string;
      content: string;
      author_name: string;
      author_avatar: string | null;
      created_at: string;
    }>
  > {
    return queries.getPostsWithImages(options);
  }
}

export const postService = new PostService();
