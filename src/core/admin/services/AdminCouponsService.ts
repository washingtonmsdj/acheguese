/**
 * AdminCouponsService - servico de administracao de cupons.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeILikePattern } from "@/shared/utils/sqlSanitization";

export interface CouponData {
  id: string;
  codigo: string;
  titulo?: string;
  description?: string | null;
  desconto: string;
  tipo?: string | null;
  tipo_desconto?: string | null;
  valor_minimo?: number;
  max_usos?: number | null;
  usos?: number | null;
  usos_count?: number | null;
  is_active: boolean;
  validade?: string | null;
  created_at?: string;
  updated_at?: string;
  business_name?: string | null;
  business_logo?: string | null;
  neighborhood?: string | null;
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

type CouponRow = {
  id: string;
  codigo: string;
  titulo: string;
  description: string | null;
  desconto: string;
  tipo: string | null;
  max_usos: number | null;
  usos: number | null;
  is_active: boolean;
  validade: string | null;
  created_at: string;
  updated_at: string;
  business_name: string | null;
  business_logo: string | null;
  neighborhood: string | null;
};

function mapCoupon(row: CouponRow): CouponData {
  return {
    ...row,
    tipo_desconto: row.tipo,
    usos_count: row.usos,
  };
}

function toCouponWrite(data: Partial<CouponData>): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  if (data.codigo !== undefined) record.codigo = data.codigo;
  if (data.titulo !== undefined) record.titulo = data.titulo;
  if (data.description !== undefined) record.description = data.description;
  if (data.desconto !== undefined) record.desconto = data.desconto;
  if (data.tipo !== undefined || data.tipo_desconto !== undefined) record.tipo = data.tipo ?? data.tipo_desconto;
  if (data.max_usos !== undefined) record.max_usos = data.max_usos;
  if (data.usos !== undefined || data.usos_count !== undefined) record.usos = data.usos ?? data.usos_count;
  if (data.is_active !== undefined) record.is_active = data.is_active;
  if (data.validade !== undefined) record.validade = data.validade;
  if (data.business_name !== undefined) record.business_name = data.business_name;
  if (data.business_logo !== undefined) record.business_logo = data.business_logo;
  if (data.neighborhood !== undefined) record.neighborhood = data.neighborhood;
  return record;
}

class AdminCouponsServiceClass {
  private readonly db = supabase as any;

  async getStats(): Promise<CouponsStats> {
    try {
      const { data, error } = await this.db
        .from("coupons")
        .select("is_active, usos, validade");

      if (error) throw error;

      const now = new Date().toISOString();
      const rows = ((data as Array<Pick<CouponRow, "is_active" | "usos" | "validade">>) || []);
      return {
        total: rows.length,
        active: rows.filter((coupon) => coupon.is_active && (!coupon.validade || coupon.validade > now)).length,
        expired: rows.filter((coupon) => !coupon.is_active || Boolean(coupon.validade && coupon.validade <= now)).length,
        totalUsage: rows.reduce((sum, coupon) => sum + (coupon.usos || 0), 0),
      };
    } catch (error) {
      logger.error("Error in AdminCouponsService.getStats", error);
      throw error;
    }
  }

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

      let query = this.db
        .from("coupons")
        .select("*", { count: "exact" });

      if (options.status === "active") {
        query = query.eq("is_active", true);
      } else if (options.status === "inactive") {
        query = query.eq("is_active", false);
      }

      if (options.search) {
        const searchPattern = buildSafeILikePattern(options.search);
        if (searchPattern) {
          query = query.ilike("codigo", searchPattern);
        }
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: ((data as CouponRow[]) || []).map(mapCoupon),
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error in AdminCouponsService.getAllCoupons", error);
      throw error;
    }
  }

  async getCouponById(id: string): Promise<CouponData | null> {
    try {
      const { data, error } = await this.db
        .from("coupons")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapCoupon(data as CouponRow) : null;
    } catch (error) {
      logger.error("Error in AdminCouponsService.getCouponById", error);
      throw error;
    }
  }

  async createCoupon(data: Partial<CouponData>): Promise<CouponData> {
    try {
      const { data: newCoupon, error } = await this.db
        .from("coupons")
        .insert({
          ...toCouponWrite(data),
          usos: 0,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapCoupon(newCoupon as CouponRow);
    } catch (error) {
      logger.error("Error in AdminCouponsService.createCoupon", error);
      throw error;
    }
  }

  async updateCoupon(id: string, updates: Partial<CouponData>): Promise<CouponData | null> {
    try {
      const { data, error } = await this.db
        .from("coupons")
        .update(toCouponWrite(updates))
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapCoupon(data as CouponRow);
    } catch (error) {
      logger.error("Error in AdminCouponsService.updateCoupon", error);
      throw error;
    }
  }

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      const { error } = await this.db.from("coupons").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in AdminCouponsService.deleteCoupon", error);
      throw error;
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await this.db
        .from("coupons")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in AdminCouponsService.toggleActive", error);
      throw error;
    }
  }

  async getActiveCoupons(): Promise<CouponData[]> {
    try {
      const { data, error } = await this.db
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data as CouponRow[]) || []).map(mapCoupon);
    } catch (error) {
      logger.error("Error in AdminCouponsService.getActiveCoupons", error);
      throw error;
    }
  }
}

export const adminCouponsService = new AdminCouponsServiceClass();
