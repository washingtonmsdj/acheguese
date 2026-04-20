/**
 * 👔 BUSINESS ADMIN — Administração e estatísticas
 * 
 * Responsabilidade única: operações administrativas e analytics
 * - Dashboards, estatísticas, claims
 * - Contagens e relatórios
 * - Cupons (legado)
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { PAGINATION } from "@/shared/constants";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";

/**
 * Buscar reivindicações de empresas
 */
export async function getBusinessClaims(filter?: string): Promise<unknown[]> {
  try {
    let query = (supabase as unknown as AdminSupabaseClient)
      .from("business_claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter && filter !== "todos") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Error fetching business claims:", error);
    return [];
  }
}

/**
 * Buscar detalhes de empresa para claim
 */
export async function getBusinessClaimDetails(
  businessId: string,
): Promise<{ profile_id: string; profiles: { name: string } } | null> {
  try {
    const { data, error } = await (supabase as unknown as AdminSupabaseClient)
      .from("business_data")
      .select("profile_id, profiles(name)")
      .eq("profile_id", businessId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Error fetching business claim details:", error);
    return null;
  }
}

/**
 * Contagem total de empresas
 */
export async function getTotalBusinessesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true });

    if (error) {
      logger.error("Error getting businesses count", error, {
        service: "BusinessAdmin",
        method: "getTotalBusinessesCount",
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error getting businesses count", error as Error, {
      service: "BusinessAdmin",
      method: "getTotalBusinessesCount",
    });
    return 0;
  }
}

/**
 * Contagem de empresas premium
 */
export async function getPremiumBusinessesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("business_data")
      .select("*", { count: "exact", head: true })
      .eq("is_premium", true);

    if (error) {
      logger.error("Error getting premium businesses count", error, {
        service: "BusinessAdmin",
        method: "getPremiumBusinessesCount",
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error getting premium businesses count", error as Error, {
      service: "BusinessAdmin",
      method: "getPremiumBusinessesCount",
    });
    return 0;
  }
}

/**
 * Empresas criadas em período
 */
export async function getBusinessesCreatedInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  try {
    const { count, error } = await (supabase as unknown as AdminSupabaseClient)
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) {
      logger.error("Error getting businesses in period", error, {
        service: "BusinessAdmin",
        method: "getBusinessesCreatedInPeriod",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error getting businesses in period", error as Error, {
      service: "BusinessAdmin",
      method: "getBusinessesCreatedInPeriod",
    });
    return 0;
  }
}

/**
 * Métricas de negócio (views, reviews)
 * @param startDate - Filtro de data inicial opcional para views
 */
export async function getBusinessMetrics(
  businessId: string,
  startDate?: string,
): Promise<{
  totalViews: number;
  weekViews: number;
  monthViews: number;
  averageRating: number;
  totalReviews: number;
}> {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    // Usar ReviewsService para estatísticas de reviews
    const reviewStats = await ReviewsService.getReviewStats(businessId, "business");

    let totalViewsQuery = (supabase as unknown as AdminSupabaseClient)
      .from("business_views")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);

    if (startDate) {
      totalViewsQuery = totalViewsQuery.gte("viewed_at", startDate);
    }

    const [viewsRes, weekRes, monthRes] = await Promise.all([
      totalViewsQuery,
      (supabase as unknown as AdminSupabaseClient)
        .from("business_views")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("viewed_at", weekAgo),
      (supabase as unknown as AdminSupabaseClient)
        .from("business_views")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("viewed_at", monthAgo),
    ]);

    return {
      totalViews: viewsRes.count || 0,
      weekViews: weekRes.count || 0,
      monthViews: monthRes.count || 0,
      averageRating: reviewStats.average_rating || 0,
      totalReviews: reviewStats.total_reviews || 0,
    };
  } catch (error) {
    logger.error("Failed to fetch business metrics:", error);
    return {
      totalViews: 0,
      weekViews: 0,
      monthViews: 0,
      averageRating: 0,
      totalReviews: 0,
    };
  }
}

/**
 * Atualiza o status de uma reivindicação de negócio
 */
export async function updateBusinessClaimStatus(
  claimId: string,
  status: "aprovada" | "rejeitada",
): Promise<boolean> {
  try {
    const { error } = await (supabase as unknown as AdminSupabaseClient)
      .from("business_claims")
      .update({ status, resolved_at: new Date().toISOString() })
      .eq("id", claimId);

    if (error) {
      logger.error("Error updating claim status:", error);
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Error in updateBusinessClaimStatus:", error);
    return false;
  }
}

/**
 * Cupons ativos (legado)
 */
export async function getActiveCoupons(): Promise<unknown[]> {
  try {
    const { data, error } = await (supabase as unknown as AdminSupabaseClient)
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching coupons:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    logger.error("Error in getActiveCoupons:", error);
    return [];
  }
}

/**
 * Cupom por ID (legado)
 */
export async function getCouponById(id: string): Promise<unknown | null> {
  try {
    const { data, error } = await (supabase as unknown as AdminSupabaseClient)
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Error fetching coupon:", error);
      return null;
    }
    return data;
  } catch (error) {
    logger.error("Error in getCouponById:", error);
    return null;
  }
}
