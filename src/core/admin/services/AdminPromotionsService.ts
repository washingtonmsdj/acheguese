/**
 * AdminPromotionsService - SSOT para gestão administrativa de promoções
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";
import type { AdminSupabaseClient } from "../types/adminDatabase.types";

export interface PromotionStats {
  total: number;
  active: number;
  expired: number;
  scheduled: number;
  byType: Record<string, number>;
  totalDiscountValue: number;
  totalUsage: number;
}

export interface Promotion {
  id: string;
  business_id?: string;
  code: string;
  title: string;
  description?: string;
  type: "percentage" | "fixed" | "freebie";
  discount_value?: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class AdminPromotionsServiceClass {
  private readonly db = supabase as any;
  /**
   * Busca estatísticas de promoções
   */
  async getStats(): Promise<PromotionStats> {
    try {
      const { data: promotions, error } = await this.db
        .from("promotions")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const stats: PromotionStats = {
        total: promotions?.length || 0,
        active: promotions?.filter(p => p.is_active && (!p.expires_at || new Date(p.expires_at) > now)).length || 0,
        expired: promotions?.filter(p => p.expires_at && new Date(p.expires_at) < now).length || 0,
        scheduled: promotions?.filter(p => new Date(p.starts_at) > now).length || 0,
        byType: {},
        totalDiscountValue: 0,
        totalUsage: promotions?.reduce((sum, p) => sum + (p.usage_count || 0), 0) || 0,
      };

      promotions?.forEach(p => {
        if (p.type) {
          stats.byType[p.type] = (stats.byType[p.type] || 0) + 1;
        }
        if (p.discount_value) {
          stats.totalDiscountValue += p.discount_value * (p.usage_count || 0);
        }
      });

      return stats;
    } catch (error) {
      logger.error("Error fetching promotion stats:", error);
      throw error;
    }
  }

  /**
   * Busca todas as promoções com paginação
   */
  async getAllPromotions(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: "active" | "expired" | "scheduled" | "all";
    businessId?: string;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
        status = "all",
        businessId,
      } = params;

      let query = this.db
        .from("promotions")
        .select(`
          *,
          business:business_data(
            id,
            name,
            logo_url
          )
        `, { count: "exact" });

      // Filtros
      if (search) {
        const searchFilter = buildSafeOrILikeFilter(["code", "title"], search);
        if (searchFilter) {
          query = query.or(searchFilter);
        }
      }
      if (type) {
        query = query.eq("type", type);
      }
      if (businessId) {
        query = query.eq("business_id", businessId);
      }

      // Filtro de status
      const now = new Date().toISOString();
      if (status === "active") {
        query = query.eq("is_active", true).or(`expires_at.is.null,expires_at.gt.${now}`);
      } else if (status === "expired") {
        query = query.lt("expires_at", now);
      } else if (status === "scheduled") {
        query = query.gt("starts_at", now);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order("created_at", { ascending: false });

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
      logger.error("Error fetching promotions:", error);
      throw error;
    }
  }

  /**
   * Cria nova promoção
   */
  async createPromotion(data: Partial<Promotion>): Promise<Promotion | null> {
    try {
      const { data: promotion, error } = await this.db
        .from("promotions")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return promotion;
    } catch (error) {
      logger.error("Error creating promotion:", error);
      return null;
    }
  }

  /**
   * Atualiza promoção
   */
  async updatePromotion(id: string, data: Partial<Promotion>): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("promotions")
        .update(data)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error updating promotion:", error);
      return false;
    }
  }

  /**
   * Ativa/desativa promoção
   */
  async toggleActive(promotionId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("promotions")
        .update({ is_active: isActive })
        .eq("id", promotionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error toggling promotion:", error);
      return false;
    }
  }

  /**
   * Deleta promoção
   */
  async deletePromotion(promotionId: string): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("promotions")
        .delete()
        .eq("id", promotionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error deleting promotion:", error);
      return false;
    }
  }

  /**
   * Busca promoções expirando
   */
  async getExpiringPromotions(daysAhead: number = 7) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await this.db
        .from("promotions")
        .select(`
          *,
          business:business_data(
            id,
            name,
            logo_url
          )
        `)
        .eq("is_active", true)
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte("expires_at", futureDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching expiring promotions:", error);
      return [];
    }
  }

  /**
   * Busca promoções mais usadas
   */
  async getTopPromotions(limit: number = 10) {
    try {
      const { data, error } = await this.db
        .from("promotions")
        .select(`
          *,
          business:business_data(
            id,
            name,
            logo_url
          )
        `)
        .order("usage_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching top promotions:", error);
      return [];
    }
  }

  /**
   * Valida código de promoção
   */
  async validateCode(code: string): Promise<{ valid: boolean; promotion?: Promotion; reason?: string }> {
    try {
      const { data: promotion, error } = await this.db
        .from("promotions")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error || !promotion) {
        return { valid: false, reason: "Código não encontrado" };
      }

      if (!promotion.is_active) {
        return { valid: false, reason: "Promoção inativa" };
      }

      const now = new Date();
      if (new Date(promotion.starts_at) > now) {
        return { valid: false, reason: "Promoção ainda não iniciou" };
      }

      if (promotion.expires_at && new Date(promotion.expires_at) < now) {
        return { valid: false, reason: "Promoção expirada" };
      }

      if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
        return { valid: false, reason: "Limite de uso atingido" };
      }

      return { valid: true, promotion };
    } catch (error) {
      logger.error("Error validating promotion code:", error);
      return { valid: false, reason: "Erro ao validar código" };
    }
  }

  /**
   * Incrementa uso de promoção
   */
  async incrementUsage(promotionId: string): Promise<boolean> {
    try {
      const { error } = await this.db.rpc("increment_promotion_usage", {
        promotion_id: promotionId,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error incrementing promotion usage:", error);
      return false;
    }
  }
}

export const adminPromotionsService = new AdminPromotionsServiceClass();
