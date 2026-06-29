import { supabase } from "@/integrations/supabase";
import type { Tables, TablesInsert } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeILikePattern } from "@/shared/utils/sqlSanitization";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  delete(): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  ilike(column: string, pattern: string): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type AdminCouponsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminCouponsDbClient;

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

type CouponRow = Tables<"coupons">;
type CouponInsert = TablesInsert<"coupons">;

function mapCoupon(row: CouponRow): CouponData {
  return {
    ...row,
    tipo_desconto: row.tipo,
    usos_count: row.usos,
  };
}

function toCouponWrite(data: Partial<CouponData>): Partial<CouponInsert> {
  const record: Partial<CouponInsert> = {};
  if (data.codigo !== undefined) record.codigo = data.codigo;
  if (data.titulo !== undefined) record.titulo = data.titulo;
  if (data.description !== undefined) record.description = data.description;
  if (data.desconto !== undefined) record.desconto = data.desconto;
  if (data.tipo !== undefined || data.tipo_desconto !== undefined) {
    record.tipo = data.tipo ?? data.tipo_desconto ?? null;
  }
  if (data.max_usos !== undefined) record.max_usos = data.max_usos;
  if (data.usos !== undefined || data.usos_count !== undefined) {
    record.usos = data.usos ?? data.usos_count ?? null;
  }
  if (data.is_active !== undefined) record.is_active = data.is_active;
  if (data.validade !== undefined) record.validade = data.validade;
  if (data.business_name !== undefined) record.business_name = data.business_name;
  if (data.business_logo !== undefined) record.business_logo = data.business_logo;
  if (data.neighborhood !== undefined) record.neighborhood = data.neighborhood;
  return record;
}

class AdminCouponsServiceClass {
  async getStats(): Promise<CouponsStats> {
    try {
      const { data, error } = await db
        .from<Pick<CouponRow, "is_active" | "usos" | "validade">>("coupons")
        .select("is_active, usos, validade");

      if (error) throw error;

      const now = new Date().toISOString();
      const rows = data || [];
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

      let query = db.from<CouponRow>("coupons").select("*", { count: "exact" });

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
        data: (data || []).map(mapCoupon),
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
      const { data, error } = await db
        .from<CouponRow>("coupons")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapCoupon(data) : null;
    } catch (error) {
      logger.error("Error in AdminCouponsService.getCouponById", error);
      throw error;
    }
  }

  async createCoupon(data: Partial<CouponData>): Promise<CouponData> {
    try {
      const payload: CouponInsert = {
        codigo: data.codigo ?? "",
        titulo: data.titulo ?? "",
        desconto: data.desconto ?? "",
        usos: 0,
        is_active: data.is_active ?? true,
        ...toCouponWrite(data),
      };

      const { data: newCoupon, error } = await db
        .from<CouponRow>("coupons")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;
      return mapCoupon(newCoupon);
    } catch (error) {
      logger.error("Error in AdminCouponsService.createCoupon", error);
      throw error;
    }
  }

  async updateCoupon(id: string, updates: Partial<CouponData>): Promise<CouponData | null> {
    try {
      const payload = toCouponWrite(updates);
      const { data, error } = await db
        .from<CouponRow>("coupons")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return mapCoupon(data);
    } catch (error) {
      logger.error("Error in AdminCouponsService.updateCoupon", error);
      throw error;
    }
  }

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      const { error } = await db.from<CouponRow>("coupons").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("Error in AdminCouponsService.deleteCoupon", error);
      throw error;
    }
  }

  async toggleActive(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await db
        .from<CouponRow>("coupons")
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
      const { data, error } = await db
        .from<CouponRow>("coupons")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapCoupon);
    } catch (error) {
      logger.error("Error in AdminCouponsService.getActiveCoupons", error);
      throw error;
    }
  }
}

export const adminCouponsService = new AdminCouponsServiceClass();
