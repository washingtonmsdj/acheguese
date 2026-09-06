/**
 * Business admin - administracao e estatisticas.
 *
 * Responsabilidade unica: dashboards, estatisticas, claims e cupons.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient } from "@/core/admin/types/adminDatabase.types";
import { AnalyticsService } from "@/core/analytics/AnalyticsService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import type { ReviewStats } from "@/core/reviews/types";
import { invokeSupabaseBrokerCommand } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";


export interface CouponRecord {
  id: string;
  codigo: string;
  titulo: string;
  description: string | null;
  tipo: string;
  desconto: string;
  validade: string | null;
  max_usos: number | null;
  usos: number | null;
  business_logo: string | null;
  business_name: string | null;
  neighborhood: string | null;
  is_active: boolean;
}

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
      .eq("id", businessId)
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
      .from("business_data")
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
      .from("business_data")
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
 * Métricas de negócio (views, reviews) pelo SSOT de Analytics.
 * @param startDate - Filtro de data inicial opcional para totalViews
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

    const [reviewStats, totalMetrics, weekMetrics, monthMetrics] = await Promise.all([
      ReviewsService.getReviewStats(businessId, "business"),
      AnalyticsService.getMetrics("business", businessId, startDate),
      AnalyticsService.getMetrics("business", businessId, weekAgo),
      AnalyticsService.getMetrics("business", businessId, monthAgo),
    ]);

    for (const result of [totalMetrics, weekMetrics, monthMetrics]) {
      if (result.error) {
        throw new Error(result.error);
      }
    }

    return {
      totalViews: totalMetrics.data?.total_views ?? 0,
      weekViews: weekMetrics.data?.total_views ?? 0,
      monthViews: monthMetrics.data?.total_views ?? 0,
      averageRating: reviewStats.average_rating ?? reviewStats.average ?? 0,
      totalReviews: reviewStats.total_reviews ?? reviewStats.total ?? 0,
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
  reviewNotes?: string,
): Promise<boolean> {
  try {
    await invokeSupabaseBrokerCommand({
      action: "resolveClaim",
      functionName: "admin-business-rpc",
      params: {
        claimId,
        decision: status === "aprovada" ? "approve" : "reject",
        reviewNotes: reviewNotes?.trim() || null,
      },
      serviceName: "BusinessAdmin",
    });
    return true;
  } catch (error) {
    logger.error("Error in updateBusinessClaimStatus:", error);
    return false;
  }
}

/**
 * Cupons ativos
 */
export async function getActiveCoupons(): Promise<CouponRecord[]> {
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
    return (data ?? []) as CouponRecord[];
  } catch (error) {
    logger.error("Error in getActiveCoupons:", error);
    return [];
  }
}

/**
 * Cupom por ID
 */
export async function getCouponById(id: string): Promise<CouponRecord | null> {
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
    return data as CouponRecord;
  } catch (error) {
    logger.error("Error in getCouponById:", error);
    return null;
  }
}
