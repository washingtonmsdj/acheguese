/**
 * AdminVagasService - SSOT para gestão administrativa de vagas
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface VagaStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byLocation: Record<string, number>;
  pending: number;
  approved: number;
  rejected: number;
}

class AdminVagasServiceClass {
  /**
   * Busca estatísticas de vagas
   */
  async getStats(): Promise<VagaStats> {
    try {
      const { data: vagas, error } = await supabase
        .from("vagas")
        .select("*");

      if (error) throw error;

      const stats: VagaStats = {
        total: vagas?.length || 0,
        active: vagas?.filter(v => v.is_active).length || 0,
        inactive: vagas?.filter(v => !v.is_active).length || 0,
        byCategory: {},
        byType: {},
        byLocation: {},
        pending: vagas?.filter(v => v.status === "pending").length || 0,
        approved: vagas?.filter(v => v.status === "approved").length || 0,
        rejected: vagas?.filter(v => v.status === "rejected").length || 0,
      };

      vagas?.forEach(v => {
        if (v.category) {
          stats.byCategory[v.category] = (stats.byCategory[v.category] || 0) + 1;
        }
        if (v.type) {
          stats.byType[v.type] = (stats.byType[v.type] || 0) + 1;
        }
        if (v.location_id) {
          stats.byLocation[v.location_id] = (stats.byLocation[v.location_id] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Error fetching vagas stats:", error);
      throw error;
    }
  }

  /**
   * Busca todas as vagas com paginação
   */
  async getAllVagas(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    type?: string;
    status?: string;
    isActive?: boolean;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        type,
        status,
        isActive,
      } = params;

      let query = supabase
        .from("vagas")
        .select(`
          *,
          company:business_data(
            id,
            name,
            logo_url
          ),
          location:locations(
            id,
            name,
            type
          )
        `, { count: "exact" });

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      if (category) {
        query = query.eq("category", category);
      }
      if (type) {
        query = query.eq("type", type);
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error fetching vagas:", error);
      throw error;
    }
  }

  /**
   * Aprova vaga
   */
  async approveVaga(vagaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({ 
          status: "approved",
          is_active: true,
          approved_at: new Date().toISOString(),
        })
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error approving vaga:", error);
      return false;
    }
  }

  /**
   * Rejeita vaga
   */
  async rejectVaga(vagaId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({ 
          status: "rejected",
          is_active: false,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error rejecting vaga:", error);
      return false;
    }
  }

  /**
   * Ativa/desativa vaga
   */
  async toggleActive(vagaId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({ is_active: isActive })
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error toggling vaga:", error);
      return false;
    }
  }

  /**
   * Deleta vaga
   */
  async deleteVaga(vagaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("vagas")
        .delete()
        .eq("id", vagaId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error deleting vaga:", error);
      return false;
    }
  }

  /**
   * Busca vagas pendentes de moderação
   */
  async getPendingVagas() {
    try {
      const { data, error } = await supabase
        .from("vagas")
        .select(`
          *,
          company:business_data(
            id,
            name,
            logo_url
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching pending vagas:", error);
      return [];
    }
  }
}

export const adminVagasService = new AdminVagasServiceClass();
