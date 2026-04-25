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
  texto?: string;
  created_at: string;
}

class LostFoundRuntimeService {
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

      if (filters.tipo) query = query.eq("tipo", filters.tipo);
      if (filters.categoria) query = query.eq("categoria", filters.categoria);
      if (filters.resolvido !== undefined) query = query.eq("resolvido", filters.resolvido);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("LostFoundRuntimeService.getPosts", error);
      return [];
    }
  }

  async getPostById(id: string): Promise<LostFoundPost | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("LostFoundRuntimeService.getPostById", error);
      return null;
    }
  }

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
      logger.error("LostFoundRuntimeService.createPost", error);
      return null;
    }
  }

  async updatePost(id: string, updates: Partial<LostFoundPost>): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from("lost_found_posts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("LostFoundRuntimeService.updatePost", error);
      return false;
    }
  }

  async toggleResolved(id: string): Promise<boolean> {
    const post = await this.getPostById(id);
    if (!post) return false;
    return this.updatePost(id, { resolvido: !post.resolvido });
  }

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
      logger.error("LostFoundRuntimeService.getComments", error);
      return [];
    }
  }

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
      logger.error("LostFoundRuntimeService.createComment", error);
      return null;
    }
  }

  async getPostsPage(
    filters: { tipo?: string; categoria?: string } = {},
    from: number,
    to: number,
  ): Promise<any[]> {
    try {
      let query = (supabase as any)
        .from("lost_found_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.tipo && filters.tipo !== "todos") query = query.eq("tipo", filters.tipo);
      if (filters.categoria && filters.categoria !== "todos") query = query.eq("category", filters.categoria);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("LostFoundRuntimeService.getPostsPage", error);
      return [];
    }
  }
}

export const lostFoundRuntimeService = new LostFoundRuntimeService();
export const lostFoundService = lostFoundRuntimeService;
export { lostFoundRuntimeService as LostFoundService };
