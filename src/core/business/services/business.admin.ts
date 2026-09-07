/**
 * Business admin - administracao e estatisticas.
 *
 * Responsabilidade unica: dashboards, estatisticas, claims e cupons.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { AnalyticsService } from "@/core/analytics/AnalyticsService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import type { ReviewStats } from "@/core/reviews/types";
import {
  invokeSupabaseBroker,
  invokeSupabaseBrokerCommand,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";


export interface CouponRecord {
  id: string;
  codigo: string;
  titulo: string;
  description: string | null;
  tipo: string | null;
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
    let query = supabase
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
): Promise<{
  profile_id: string;
  profiles: { name: string };
  school_type: string | null;
} | null> {
  try {
    const { data: business, error: businessError } = await supabase
      .from("business_data")
      .select("profile_id")
      .eq("id", businessId)
      .maybeSingle();

    if (businessError) throw businessError;
    if (!business) return null;

    const [profile, educationResult] = await Promise.all([
      profileService.getProfileById(business.profile_id),
      supabase
        .from("education_profiles")
        .select("school_type")
        .eq("business_id", business.profile_id)
        .maybeSingle(),
    ]);

    if (educationResult.error) {
      logger.warn(
        "Failed to resolve Education claim metadata:",
        educationResult.error,
      );
    }

    return {
      profile_id: business.profile_id,
      profiles: { name: profile?.name ?? "Removida" },
      school_type: educationResult.data?.school_type ?? null,
    };
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
    const { count, error } = await supabase
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

export type InstitutionAuthorityKind =
  | "maintainer"
  | "municipal_secretariat"
  | "state_secretariat"
  | "federal_authority"
  | "education_network"
  | "public_agency";

export interface GrantBusinessInstitutionScopeInput {
  authorityProfileId: string;
  targetProfileId: string;
  authorityKind: InstitutionAuthorityKind;
  evidenceUrl: string;
  grantReason: string;
}

export interface BusinessInstitutionAuthorityOption {
  profile_id: string;
  name: string;
}

export interface BusinessInstitutionSchoolOption {
  profile_id: string;
  name: string;
  school_network: string | null;
  inep_code: string | null;
}

export interface BusinessInstitutionScopeRecord {
  scope_id: string;
  authority_profile_id: string;
  authority_name: string;
  target_profile_id: string;
  target_name: string;
  authority_kind: InstitutionAuthorityKind;
  school_network: string | null;
  inep_code: string | null;
  evidence_url: string;
  grant_reason: string;
  granted_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  is_active: boolean;
}

export interface BusinessInstitutionScopeAdminModel {
  authorities: BusinessInstitutionAuthorityOption[];
  schools: BusinessInstitutionSchoolOption[];
  scopes: BusinessInstitutionScopeRecord[];
}

/**
 * Le o modelo administrativo de autoridade institucional sem expor a tabela
 * private ao browser.
 */
export async function getBusinessInstitutionScopeAdminModel(): Promise<
  BusinessInstitutionScopeAdminModel | null
> {
  try {
    return await invokeSupabaseBroker<
      BusinessInstitutionScopeAdminModel,
      "getInstitutionScopeAdminModel"
    >({
      action: "getInstitutionScopeAdminModel",
      functionName: "admin-business-rpc",
      serviceName: "BusinessAdmin",
      noDataMessage: "Institution scope broker returned no admin model",
    });
  } catch (error) {
    logger.error("Error loading business institution scope admin model:", error);
    return null;
  }
}

/**
 * Concede gestao institucional herdada sobre uma escola publica.
 *
 * A autorizacao real permanece no banco e no admin-business-rpc. Esta funcao
 * nao grava memberships nas escolas e nao transfere ownership estrutural.
 */
export async function grantBusinessInstitutionScope(
  input: GrantBusinessInstitutionScopeInput,
): Promise<string | null> {
  try {
    return await invokeSupabaseBroker<string, "grantInstitutionScope">({
      action: "grantInstitutionScope",
      functionName: "admin-business-rpc",
      params: input,
      serviceName: "BusinessAdmin",
      noDataMessage: "Institution scope broker returned no scope id",
    });
  } catch (error) {
    logger.error("Error granting business institution scope:", error);
    return null;
  }
}

/**
 * Revoga imediatamente uma gestao institucional herdada.
 */
export async function revokeBusinessInstitutionScope(
  scopeId: string,
  revocationReason: string,
): Promise<boolean> {
  try {
    await invokeSupabaseBrokerCommand({
      action: "revokeInstitutionScope",
      functionName: "admin-business-rpc",
      params: {
        scopeId,
        revocationReason: revocationReason.trim(),
      },
      serviceName: "BusinessAdmin",
    });
    return true;
  } catch (error) {
    logger.error("Error revoking business institution scope:", error);
    return false;
  }
}

/**
 * Cupons ativos
 */
export async function getActiveCoupons(): Promise<CouponRecord[]> {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching coupons:", error);
      return [];
    }
    return data ?? [];
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
    const { data, error } = await supabase
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
