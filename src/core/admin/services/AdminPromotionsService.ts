import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";

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

type RpcPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  delete(): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  lt(column: string, value: unknown): TableClient<TRow>;
  gt(column: string, value: unknown): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
  not(column: string, operator: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type AdminPromotionsDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<TRow = unknown>(fn: string, args?: Record<string, unknown>): Promise<RpcPayload<TRow>>;
};

const db = supabase as unknown as AdminPromotionsDbClient;

type PromotionType = "percentage" | "fixed" | "freebie";

type PromotionRow = {
  id: string;
  business_id: string | null;
  code: string;
  title: string;
  description: string | null;
  type: PromotionType;
  discount_value: number | null;
  min_purchase: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number | null;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  business?: PromotionBusinessRow | readonly PromotionBusinessRow[] | null;
};

type PromotionBusinessRow = {
  id: string;
  business_name: string | null;
  slug: string | null;
};

type PromotionInsertRow = Partial<PromotionRow>;
type PromotionUpdateRow = Partial<PromotionRow>;

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
  type: PromotionType;
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
  business?: {
    id: string;
    name?: string;
    logo_url?: string | null;
    slug?: string | null;
  } | null;
}

function normalizeBusiness(
  business: PromotionRow["business"],
): Promotion["business"] {
  const resolved = Array.isArray(business) ? business[0] : business;
  if (!resolved) return null;

  return {
    id: resolved.id,
    name: resolved.business_name ?? undefined,
    logo_url: null,
    slug: resolved.slug ?? undefined,
  };
}

function mapPromotion(row: PromotionRow): Promotion {
  return {
    id: row.id,
    business_id: row.business_id ?? undefined,
    code: row.code,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    discount_value: row.discount_value ?? undefined,
    min_purchase: row.min_purchase ?? undefined,
    max_discount: row.max_discount ?? undefined,
    usage_limit: row.usage_limit ?? undefined,
    usage_count: row.usage_count ?? 0,
    starts_at: row.starts_at,
    expires_at: row.expires_at ?? undefined,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    business: normalizeBusiness(row.business),
  };
}

function toPromotionWrite(data: Partial<Promotion>): PromotionInsertRow {
  const payload: PromotionInsertRow = {};
  if (data.business_id !== undefined) payload.business_id = data.business_id;
  if (data.code !== undefined) payload.code = data.code.toUpperCase();
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description ?? null;
  if (data.type !== undefined) payload.type = data.type;
  if (data.discount_value !== undefined) payload.discount_value = data.discount_value;
  if (data.min_purchase !== undefined) payload.min_purchase = data.min_purchase;
  if (data.max_discount !== undefined) payload.max_discount = data.max_discount;
  if (data.usage_limit !== undefined) payload.usage_limit = data.usage_limit;
  if (data.usage_count !== undefined) payload.usage_count = data.usage_count;
  if (data.starts_at !== undefined) payload.starts_at = data.starts_at;
  if (data.expires_at !== undefined) payload.expires_at = data.expires_at ?? null;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  if (data.created_at !== undefined) payload.created_at = data.created_at;
  if (data.updated_at !== undefined) payload.updated_at = data.updated_at;
  return payload;
}

class AdminPromotionsServiceClass {
  async getStats(): Promise<PromotionStats> {
    try {
      const { data, error } = await db
        .from<PromotionRow>("promotions")
        .select("*");

      if (error) throw error;

      const promotions = data ?? [];
      const now = new Date();
      const stats: PromotionStats = {
        total: promotions.length,
        active: promotions.filter(
          (promotion) =>
            promotion.is_active &&
            (!promotion.expires_at || new Date(promotion.expires_at) > now),
        ).length,
        expired: promotions.filter(
          (promotion) => Boolean(promotion.expires_at && new Date(promotion.expires_at) < now),
        ).length,
        scheduled: promotions.filter((promotion) => new Date(promotion.starts_at) > now).length,
        byType: {},
        totalDiscountValue: 0,
        totalUsage: promotions.reduce(
          (sum, promotion) => sum + (promotion.usage_count ?? 0),
          0,
        ),
      };

      for (const promotion of promotions) {
        stats.byType[promotion.type] = (stats.byType[promotion.type] ?? 0) + 1;
        if (promotion.discount_value) {
          stats.totalDiscountValue += promotion.discount_value * (promotion.usage_count ?? 0);
        }
      }

      return stats;
    } catch (error) {
      logger.error("AdminPromotionsService.getStats", error as Error);
      throw error;
    }
  }

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

      let query = db.from<PromotionRow>("promotions").select(
        `
          *,
          business:business_data(
            id,
            business_name,
            slug
          )
        `,
        { count: "exact" },
      );

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

      const now = new Date().toISOString();
      if (status === "active") {
        query = query.eq("is_active", true).or(`expires_at.is.null,expires_at.gt.${now}`);
      } else if (status === "expired") {
        query = query.lt("expires_at", now);
      } else if (status === "scheduled") {
        query = query.gt("starts_at", now);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data ?? []).map(mapPromotion),
        count: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    } catch (error) {
      logger.error("AdminPromotionsService.getAllPromotions", error as Error, params);
      throw error;
    }
  }

  async createPromotion(data: Partial<Promotion>): Promise<Promotion | null> {
    try {
      const payload = toPromotionWrite(data);
      const { data: promotion, error } = await db
        .from<PromotionRow>("promotions")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;
      return promotion ? mapPromotion(promotion) : null;
    } catch (error) {
      logger.error("AdminPromotionsService.createPromotion", error as Error, data);
      return null;
    }
  }

  async updatePromotion(id: string, data: Partial<Promotion>): Promise<boolean> {
    try {
      const payload = toPromotionWrite(data);
      if (Object.keys(payload).length === 0) return true;

      const { error } = await db
        .from<PromotionRow>("promotions")
        .update(payload as PromotionUpdateRow)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminPromotionsService.updatePromotion", error as Error, { id, data });
      return false;
    }
  }

  async toggleActive(promotionId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await db
        .from<PromotionRow>("promotions")
        .update({ is_active: isActive })
        .eq("id", promotionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminPromotionsService.toggleActive", error as Error, {
        promotionId,
        isActive,
      });
      return false;
    }
  }

  async deletePromotion(promotionId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from<PromotionRow>("promotions")
        .delete()
        .eq("id", promotionId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminPromotionsService.deletePromotion", error as Error, {
        promotionId,
      });
      return false;
    }
  }

  async getExpiringPromotions(daysAhead = 7): Promise<Promotion[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await db.from<PromotionRow>("promotions").select(
        `
          *,
          business:business_data(
            id,
            business_name,
            slug
          )
        `,
      )
        .eq("is_active", true)
        .not("expires_at", "is", null)
        .gte("expires_at", now.toISOString())
        .lte("expires_at", futureDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapPromotion);
    } catch (error) {
      logger.error("AdminPromotionsService.getExpiringPromotions", error as Error, {
        daysAhead,
      });
      return [];
    }
  }

  async getTopPromotions(limit = 10): Promise<Promotion[]> {
    try {
      const { data, error } = await db.from<PromotionRow>("promotions").select(
        `
          *,
          business:business_data(
            id,
            business_name,
            slug
          )
        `,
      )
        .order("usage_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map(mapPromotion);
    } catch (error) {
      logger.error("AdminPromotionsService.getTopPromotions", error as Error, { limit });
      return [];
    }
  }

  async validateCode(
    code: string,
  ): Promise<{ valid: boolean; promotion?: Promotion; reason?: string }> {
    try {
      const { data: promotion, error } = await db
        .from<PromotionRow>("promotions")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error || !promotion) {
        return { valid: false, reason: "Codigo nao encontrado" };
      }

      if (!promotion.is_active) {
        return { valid: false, reason: "Promocao inativa" };
      }

      const now = new Date();
      if (new Date(promotion.starts_at) > now) {
        return { valid: false, reason: "Promocao ainda nao iniciou" };
      }

      if (promotion.expires_at && new Date(promotion.expires_at) < now) {
        return { valid: false, reason: "Promocao expirada" };
      }

      if (promotion.usage_limit && (promotion.usage_count ?? 0) >= promotion.usage_limit) {
        return { valid: false, reason: "Limite de uso atingido" };
      }

      return { valid: true, promotion: mapPromotion(promotion) };
    } catch (error) {
      logger.error("AdminPromotionsService.validateCode", error as Error, { code });
      return { valid: false, reason: "Erro ao validar codigo" };
    }
  }

  async incrementUsage(promotionId: string): Promise<boolean> {
    try {
      const { error } = await db.rpc("increment_promotion_usage", {
        promotion_id: promotionId,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error("AdminPromotionsService.incrementUsage", error as Error, {
        promotionId,
      });
      return false;
    }
  }
}

export const adminPromotionsService = new AdminPromotionsServiceClass();
