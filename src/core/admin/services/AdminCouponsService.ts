/**
 * AdminCouponsService - Serviço de administração de cupons
 *
 * ✅ SSOT COMPLIANCE: Encapsula operações de cupons
 * Este serviço encapsula operações administrativas de cupons.
 * Atualmente delega para funções legadas em business.admin.ts,
 * mas fornece interface SSOT para admin.
 *
 * TODO: Migrar para um CouponsService dedicado em core/coupons
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface CouponData {
  id: string;
  codigo: string;
  description?: string;
  desconto: string; // discount value as string
  tipo_desconto?: string; // discount type
  valor_minimo?: number;
  max_usos?: number;
  usos_count?: number;
  is_active: boolean;
  validade?: string; // expires_at
  business_id?: string;
  created_at: string;
  updated_at: string;
  business_name?: string;
  business_logo?: string;
  neighborhood?: string;
}

export interface CouponsStats {
  total: number;
  active: number;
  expired: number;
  totalUsage: number;
}

export interface CouponsListResult {
  data: CouponData[];
  total: number;
  page: number;
  totalPages: number;
}

class AdminCouponsServiceClass {
  /**
   * Busca estatísticas de cupons
   */
  async getStats(): Promise<CouponsStats> {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("is_active, usos_count, validade");

      if (error) {
        logger.error("Error fetching coupons stats:", error);
        throw error;
      }

      const now = new Date().toISOString();
      const stats: CouponsStats = {
        total: data?.length || 0,
        active: data?.filter((c: any) => c.is_active && (!c.validade || c.validade > now)).length || 0,
        expired: data?.filter((c: any) => !c.is_active || (c.validade && c.validade <= now)).length || 0,
        totalUsage: data?.reduce((sum: number, c: any) => sum + (c.usos_count || 0), 0) || 0,
      };

      return stats;
    } catch (error) {
      logger.error("Error in getStats:", error);
      throw error;
    }
  }

  /**
   * Busca todos os cupons com paginação
   */
  async getAllCoupons(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<CouponsListResult> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("coupons")
        .select(
          `
          *,
          business:businesses(id, business_name, logo_url)
          `,
          { count: "exact" }
        );

      // Aplica filtro de status se fornecido
      if (options.status === "active") {
        query = query.eq("is_active", true);
      } else if (options.status === "inactive") {
        query = query.eq("is_active", false);
      }

      // Aplica busca se fornecida
      if (options.search) {
        query = query.ilike("codigo", `%${options.search}%`);
      }

      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error("Error fetching coupons:", error);
        throw error;
      }

      // Map database response to CouponData interface
      const coupons = (data || []).map((item: any) => ({
        ...item,
        business_name: item.business?.business_name,
        business_logo: item.business?.logo_url,
      })) as CouponData[];

      return {
        data: coupons,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in getAllCoupons:", error);
      throw error;
    }
  }

  /**
   * Busca um cupom por ID
   * ✅ SSOT: Usa função legada de business.admin
   */
  async getCouponById(id: string): Promise<CouponData | null> {
    try {
      const { getCouponById } = await import("@/core/business/services/business.admin");
      const coupon = await getCouponById(id);
      return coupon as CouponData | null;
    } catch (error) {
      logger.error("Error in getCouponById:", error);
      throw error;
    }
  }

  /**
   * Cria um novo cupom
   */
  async createCoupon(data: Partial<CouponData>): Promise<CouponData> {
    try {
      const { data: newCoupon, error } = await (supabase as any)
        .from("coupons")
        .insert({
          codigo: data.codigo,
          description: data.description,
          desconto: data.desconto,
          tipo_desconto: data.tipo_desconto,
          valor_minimo: data.valor_minimo,
          max_usos: data.max_usos,
          usos_count: 0,
          is_active: data.is_active ?? true,
          validade: data.validade,
          business_id: data.business_id,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating coupon:", error);
        throw error;
      }

      return newCoupon as CouponData;
    } catch (error) {
      logger.error("Error in createCoupon:", error);
      throw error;
    }
  }

  /**
   * Atualiza um cupom
   */
  async updateCoupon(
    id: string,
    updates: Partial<CouponData>,
  ): Promise<CouponData | null> {
    try {
      // Map standard field names to actual schema
      const schemaUpdates: any = {};
      if (updates.codigo !== undefined) schemaUpdates.codigo = updates.codigo;
      if (updates.description !== undefined) schemaUpdates.description = updates.description;
      if (updates.desconto !== undefined) schemaUpdates.desconto = updates.desconto;
      if (updates.tipo_desconto !== undefined) schemaUpdates.tipo_desconto = updates.tipo_desconto;
      if (updates.valor_minimo !== undefined) schemaUpdates.valor_minimo = updates.valor_minimo;
      if (updates.max_usos !== undefined) schemaUpdates.max_usos = updates.max_usos;
      if (updates.is_active !== undefined) schemaUpdates.is_active = updates.is_active;
      if (updates.validade !== undefined) schemaUpdates.validade = updates.validade;
      if (updates.business_id !== undefined) schemaUpdates.business_id = updates.business_id;

      const { data, error } = await (supabase as any)
        .from("coupons")
        .update(schemaUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating coupon:", error);
        throw error;
      }

      return data as CouponData;
    } catch (error) {
      logger.error("Error in updateCoupon:", error);
      throw error;
    }
  }

  /**
   * Deleta um cupom
   */
  async deleteCoupon(id: string): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) {
        logger.error("Error deleting coupon:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in deleteCoupon:", error);
      throw error;
    }
  }

  /**
   * Toggle active status (para quick actions)
   */
  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await (supabase as any)
        .from("coupons")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) {
        logger.error("Error toggling coupon active status:", error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("Error in toggleActive:", error);
      throw error;
    }
  }

  /**
   * Busca cupons ativos (legado wrapper)
   * ✅ SSOT: Usa função legada de business.admin
   */
  async getActiveCoupons(): Promise<CouponData[]> {
    try {
      const { getActiveCoupons } = await import("@/core/business/services/business.admin");
      const coupons = await getActiveCoupons();
      return coupons as CouponData[];
    } catch (error) {
      logger.error("Error in getActiveCoupons:", error);
      throw error;
    }
  }
}

export const adminCouponsService = new AdminCouponsServiceClass();
