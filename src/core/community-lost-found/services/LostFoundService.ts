import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { TerritoryFilter } from "@/core/location";

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
  location_id?: string | null;
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

class LostFoundServiceClass {
  async getPosts(
    filters: {
      tipo?: "perdido" | "achado";
      categoria?: string;
      resolvido?: boolean;
      territoryFilter?: TerritoryFilter;
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
      if (filters.territoryFilter?.scope === "location") {
        query = query.eq("location_id", filters.territoryFilter.location_id);
      } else if (filters.territoryFilter?.scope === "group" && filters.territoryFilter.location_ids.length > 0) {
        query = query.in("location_id", filters.territoryFilter.location_ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("LostFoundService.getPosts", error);
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
      logger.error("LostFoundService.getPostById", error);
      return null;
    }
  }

  async createPost(postData: Omit<LostFoundPost, "id" | "created_at" | "updated_at">): Promise<LostFoundPost | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_posts")
        .insert([postData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("LostFoundService.createPost", error);
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
      logger.error("LostFoundService.updatePost", error);
      return false;
    }
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
      logger.error("LostFoundService.getComments", error);
      return [];
    }
  }

  async createComment(commentData: Omit<LostFoundComment, "id" | "created_at">): Promise<LostFoundComment | null> {
    try {
      const { data, error } = await (supabase as any)
        .from("lost_found_comments")
        .insert([commentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("LostFoundService.createComment", error);
      return null;
    }
  }

  async getPostsPage(
    filters: { tipo?: string; categoria?: string; territoryFilter?: TerritoryFilter } = {},
    from: number,
    to: number,
  ): Promise<LostFoundPost[]> {
    try {
      let query = (supabase as any)
        .from("lost_found_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.tipo && filters.tipo !== "todos") query = query.eq("tipo", filters.tipo);
      if (filters.categoria && filters.categoria !== "todos") query = query.eq("category", filters.categoria);
      if (filters.territoryFilter?.scope === "location") {
        query = query.eq("location_id", filters.territoryFilter.location_id);
      } else if (filters.territoryFilter?.scope === "group" && filters.territoryFilter.location_ids.length > 0) {
        query = query.in("location_id", filters.territoryFilter.location_ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("LostFoundService.getPostsPage", error);
      return [];
    }
  }
}

export const lostFoundService = new LostFoundServiceClass();
export { lostFoundService as LostFoundService };
