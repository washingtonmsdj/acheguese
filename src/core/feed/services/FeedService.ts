/**
 * Feed Service
 *
 * Serviço profissional de gerenciamento de feed
 *
 * Responsabilidades:
 * - Buscar posts com filtros de localização
 * - Paginação cursor-based
 * - CRUD de posts
 * - Performance < 100ms
 */

import { supabase } from "@/integrations/supabase";
import { postService } from "@/core/posts/services"; // ✅ SSOT - Usar PostService
import type {
  Post,
  FeedParams,
  FeedResult,
  CreatePostData,
  UpdatePostData,
} from "../types";
import { FeedError } from "../types";
class FeedService {
  /**
   * Busca posts do feed com filtros e paginação
   *
   * @param params - Parâmetros de busca
   * @returns Posts paginados
   */
  async getFeed(params: FeedParams = {}): Promise<FeedResult> {
    try {
      const {
        city,
        neighborhood,
        street,
        context = "all",
        cursor,
        limit = 20,
      } = params;

      // Verifica autenticação para contextos específicos
      const {
        data: { user },
      } = await (supabase as any).auth.getUser();

      if ((context === "my_posts" || context === "saved") && !user) {
        throw new FeedError("User not authenticated", "UNAUTHENTICATED", 401);
      }

      // ✅ SSOT - Usar PostService para buscar posts
      const posts = await postService.getPostsByLocation(
        { city, neighborhood, street },
        { limit: limit + 1, cursor },
      );

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
        posts: resultPosts,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error fetching feed", "UNKNOWN_ERROR");
    }
  }

  /**
   * Busca um post específico por ID
   *
   * @param postId - ID do post
   * @returns Post ou null
   */
  async getPostById(postId: string): Promise<Post | null> {
    try {
      // ✅ LOTE 8 - Delegado ao PostService (canonical boundary)
      return await postService.getPostById(postId);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error fetching post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Cria um novo post
   *
   * @param profileId - ID do profile que está criando
   * @param date - Dados do post
   * @returns Post created
   */
  async createPost(profileId: string, date: CreatePostData): Promise<Post> {
    try {
      // ✅ LOTE 8 - Delegado ao PostService (canonical boundary)
      return await postService.createPost(profileId, date);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error creating post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Atualiza um post
   *
   * @param postId - ID do post
   * @param date - Dados para update
   * @returns Post updated
   */
  async updatePost(postId: string, date: UpdatePostData): Promise<Post> {
    try {
      // ✅ SSOT - Usar PostService
      return await postService.updatePost(postId, date);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error updating post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Deleta um post
   *
   * @param postId - ID do post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      // ✅ SSOT - Usar PostService
      await postService.deletePost(postId);
    } catch (error) {
      if (error instanceof FeedError) throw error;
      throw new FeedError("Unexpected error deleting post", "UNKNOWN_ERROR");
    }
  }

  /**
   * Codifica cursor para paginação
   *
   * @param date - Dados do cursor
   * @returns Cursor codificado
   */
  private encodeCursor(date: { created_at: string }): string {
    return Buffer.from(JSON.stringify(date)).toString("base64");
  }

  /**
   * Decodifica cursor de paginação
   *
   * @param cursor - Cursor codificado
   * @returns Dados do cursor
   */
  private decodeCursor(cursor: string): { created_at: string } {
    try {
      return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
    } catch {
      throw new FeedError("Invalid cursor", "INVALID_CURSOR", 400);
    }
  }
}

export const feedService = new FeedService();
