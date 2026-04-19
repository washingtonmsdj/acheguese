/**
 * LostFoundService - SSOT para lost_found_posts, lost_found_comments
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface LostFoundPost {
  id: string;
  autor_id: string;
  tipo: "perdido" | "achado";
  titulo: string;
  descricao: string;
  categoria: string;
  local_perdido?: string;
  data_perdido?: string;
  imagens?: string[];
  contato_telefone?: string;
  contato_email?: string;
  resolvido: boolean;
  created_at: string;
  updated_at: string;
}

export interface LostFoundComment {
  id: string;
  post_id: string;
  autor_id: string;
  conteudo: string;
  created_at: string;
}

class LostFoundServiceClass {
  /**
   * Busca posts de achados e perdidos
   */
  async getPosts(
    filters: {
      tipo?: "perdido" | "achado";
      categoria?: string;
      resolvido?: boolean;
    } = {},
  ): Promise<LostFoundPost[]> {
    try {
      let query = (supabase as any)
        .from("lost_found_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.tipo) {
        query = query.eq("tipo", filters.tipo);
      }

      if (filters.categoria) {
        query = query.eq("categoria", filters.categoria);
      }

      if (filters.resolvido !== undefined) {
        query = query.eq("resolvido", filters.resolvido);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error("Error fetching lost found posts:", error);
      return [];
    }
  }

  /**
   * Busca post por ID
   */
  async getPostById(id: string): Promise<LostFoundPost | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error fetching lost found post:", error);
      return null;
    }
  }

  /**
   * Cria novo post
   */
  async createPost(
    postData: Omit<LostFoundPost, "id" | "created_at" | "updated_at">,
  ): Promise<LostFoundPost | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_posts")
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error creating lost found post:", error);
      return null;
    }
  }

  /**
   * Atualiza post
   */
  async updatePost(
    id: string,
    updates: Partial<LostFoundPost>,
  ): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from("lost_found_posts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error updating lost found post:", error);
      return false;
    }
  }

  /**
   * Marca post como resolvido/não resolvido
   */
  async toggleResolved(id: string): Promise<boolean> {
    try {
      // Buscar estado atual
      const post = await this.getPostById(id);
      if (!post) return false;

      return await this.updatePost(id, { resolvido: !post.resolvido });
    } catch (error) {
      logger.error("Error toggling post resolved status:", error);
      return false;
    }
  }

  /**
   * Busca comentários de um post
   */
  async getComments(postId: string): Promise<LostFoundComment[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching lost found comments:", error);
      return [];
    }
  }

  /**
   * Cria novo comentário
   */
  async createComment(
    commentData: Omit<LostFoundComment, "id" | "created_at">,
  ): Promise<LostFoundComment | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_comments")
        .insert([commentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error creating lost found comment:", error);
      return null;
    }
  }

  /**
   * Busca posts com paginação (infinite scroll)
   * ✅ LOTE 9A - Boundary canônico para paginação de lost_found_posts
   *
   * @param filters - Filtros de tipo e categoria
   * @param from - Índice inicial (range)
   * @param to - Índice final (range)
   */
  async getPostsPage(
    filters: {
      tipo?: string;
      categoria?: string;
    } = {},
    from: number,
    to: number,
  ): Promise<any[]> {
    try {
      let query = (supabase as any)
        .from("lost_found_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.tipo && filters.tipo !== "todos") {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters.categoria && filters.categoria !== "todos") {
        query = query.eq("category", filters.categoria);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching lost found posts page:", error);
      return [];
    }
  }
}

export const lostFoundService = new LostFoundServiceClass();
export { lostFoundService as LostFoundService };
