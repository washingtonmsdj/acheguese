// @ts-nocheck
/**
 * AdminClassifiedsService - Serviço de administração de classificados
 *
 * ✅ SSOT COMPLIANCE: Delega para ClassifiedService (modules/classifieds)
 * Este serviço encapsula operações administrativas de classificados,
 * delegando para o ClassifiedService (SSOT) sempre que possível.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/shared/utils/logger";
import { ClassifiedsFacade } from "@/modules/classifieds/services/ClassifiedService";
import type { ClassifiedData } from "@/modules/classifieds/services/types";

export interface AdminClassifiedData extends ClassifiedData {
  // Admin-specific fields
  seller_name?: string;
  seller_avatar?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
}

export interface ClassifiedsStats {
  total: number;
  active: number;
  inactive: number;
  sold: number;
  pending: number;
  rejected: number;
}

export interface ClassifiedsListResult {
  data: AdminClassifiedData[];
  total: number;
  page: number;
  totalPages: number;
}

class AdminClassifiedsServiceClass {
  /**
   * Busca estatísticas de classificados
   */
  async getStats(): Promise<ClassifiedsStats> {
    try {
      const { data, error } = await supabase
        .from("classifieds")
        .select("status")
        .not("status", "is", null);

      if (error) {
        logger.error("Error fetching classifieds stats:", error);
        throw error;
      }

      const stats: ClassifiedsStats = {
        total: data?.length || 0,
        active: data?.filter((c: any) => c.status === "active").length || 0,
        inactive: data?.filter((c: any) => c.status === "inactive").length || 0,
        sold: data?.filter((c: any) => c.status === "sold").length || 0,
        pending: data?.filter((c: any) => c.status === "pending").length || 0,
        rejected: data?.filter((c: any) => c.status === "rejected").length || 0,
      };

      return stats;
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

  /**
   * Busca todos os classificados com paginação
   * ✅ SSOT: Delega para ClassifiedsFacade.queries.getAllClassifieds
   */
  async getAllClassifieds(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ClassifiedsListResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("classifieds")
        .select(
          `
          *,
          seller:profiles!seller_id (
            id,
            name,
            avatar_url,
            phone,
            whatsapp
          ),
          locations(name, slug),
          classified_categories(slug, name),
          classified_subcategories(slug, name)
          `,
          { count: "exact" }
        );

      // Aplica filtro de status se fornecido
      if (options.status) {
        query = query.eq("status", options.status);
      }

      // Aplica busca se fornecida
      if (options.search) {
        query = query.ilike("title", `%${options.search}%`);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error("Error fetching classifieds:", error);
        throw error;
      }

      const classifieds: AdminClassifiedData[] = (data || []).map((item: any) => ({
        ...item,
        seller_name: item.seller?.name,
        seller_avatar: item.seller?.avatar_url,
        seller_phone: item.seller?.phone,
        seller_whatsapp: item.seller?.whatsapp,
        category_slug: item.classified_categories?.slug,
        subcategory_slug: item.classified_subcategories?.slug,
      }));

      return {
        data: classifieds,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in getAllClassifieds:", error);
      throw error;
    }
  }

  /**
   * Busca um classificado por ID
   * ✅ SSOT: Delega para ClassifiedsFacade.queries.getClassifiedById
   */
  async getClassifiedById(id: string): Promise<AdminClassifiedData | null> {
    try {
      const classified = await ClassifiedsFacade.queries.getClassifiedById(id);
      
      if (!classified) {
        return null;
      }

      return classified as AdminClassifiedData;
    } catch (error) {
      logger.error("Error in getClassifiedById:", error);
      throw error;
    }
  }

  /**
   * Atualiza um classificado
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.updateClassified
   */
  async updateClassified(
    id: string,
    updates: Partial<AdminClassifiedData>,
  ): Promise<AdminClassifiedData | null> {
    try {
      // Para admin, precisamos do seller_id para atualizar
      // Busca o classificado primeiro para obter seller_id
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      // Remove status from updates if present (use specific methods for status changes)
      const { status, ...safeUpdates } = updates;

      const updated = await ClassifiedsFacade.mutations.updateClassified(
        id,
        existing.seller_id,
        safeUpdates as any,
      );
      
      return updated as AdminClassifiedData;
    } catch (error) {
      logger.error("Error in updateClassified:", error);
      throw error;
    }
  }

  /**
   * Deleta um classificado
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.deleteClassified
   */
  async deleteClassified(id: string): Promise<boolean> {
    try {
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      await ClassifiedsFacade.mutations.deleteClassified(id, existing.seller_id);
      return true;
    } catch (error) {
      logger.error("Error in deleteClassified:", error);
      throw error;
    }
  }

  /**
   * Aprova um classificado (muda status para active)
   */
  async approveClassified(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("classifieds")
        .update({ status: "active" })
        .eq("id", id);

      if (error) {
        logger.error("Error approving classified:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in approveClassified:", error);
      throw error;
    }
  }

  /**
   * Rejeita um classificado (muda status para rejected)
   */
  async rejectClassified(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("classifieds")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) {
        logger.error("Error rejecting classified:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in rejectClassified:", error);
      throw error;
    }
  }

  /**
   * Marca um classificado como vendido
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.markAsSold
   */
  async markAsSold(id: string): Promise<boolean> {
    try {
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      await ClassifiedsFacade.mutations.markAsSold(id, existing.seller_id);
      return true;
    } catch (error) {
      logger.error("Error in markAsSold:", error);
      throw error;
    }
  }

  /**
   * Reativa um classificado
   * ✅ SSOT: Delega para ClassifiedsFacade.mutations.reactivateClassified
   */
  async reactivateClassified(id: string): Promise<boolean> {
    try {
      const existing = await this.getClassifiedById(id);
      
      if (!existing) {
        throw new Error("Classified not found");
      }

      await ClassifiedsFacade.mutations.reactivateClassified(id, existing.seller_id);
      return true;
    } catch (error) {
      logger.error("Error in reactivateClassified:", error);
      throw error;
    }
  }

  /**
   * Toggle active status (para quick actions)
   */
  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const status = isActive ? "active" : "inactive";
      const { error } = await supabase
        .from("classifieds")
        .update({ status })
        .eq("id", id);

      if (error) {
        logger.error("Error toggling classified active status:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in toggleActive:", error);
      throw error;
    }
  }
}

export const adminClassifiedsService = new AdminClassifiedsServiceClass();
