/**
 * ⭐ REVIEWS QUERIES - SSOT v2.0
 *
 * Operações de leitura para reviews/avaliações.
 * Todas as queries são pure functions que recebem parâmetros e retornam dados.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { selectLooseRows } from "@/integrations/supabase/services/supabaseHelpers";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  Review,
  ReviewWithProfiles,
  ReviewStats,
  ReviewType,
} from "../types";

// ============================================================================
// 🔧 HELPERS
// ============================================================================

function getTableName(type: ReviewType): string {
  return type === "business" ? "business_reviews_new" : "professional_reviews_new";
}

function hasErrorCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === code);
}

// ============================================================================
// 🔍 QUERY OPERATIONS
// ============================================================================

/**
 * Verificar se um profile já avaliou outro
 */
export async function hasReviewed(
  reviewedProfileId: string,
  reviewerProfileId: string,
  type: ReviewType,
): Promise<boolean> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<{ id: string }>(table, {
      columns: "id",
      filters: [
        { op: "eq", column: "reviewed_profile_id", value: reviewedProfileId },
        { op: "eq", column: "reviewer_profile_id", value: reviewerProfileId },
      ],
      limit: 1,
    });

    if (error && !hasErrorCode(error, "PGRST116")) {
      throw error;
    }

    return !!data?.length;
  } catch (error) {
    logger.error("[reviews.queries] Error checking if reviewed:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "hasReviewed",
      metadata: { reviewedProfileId, reviewerProfileId, type },
    });
    return false;
  }
}

/**
 * Buscar review específico de um reviewer
 */
export async function getReviewByReviewer(
  reviewedProfileId: string,
  reviewerProfileId: string,
  type: ReviewType,
): Promise<Review | null> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<Review>(table, {
      filters: [
        { op: "eq", column: "reviewed_profile_id", value: reviewedProfileId },
        { op: "eq", column: "reviewer_profile_id", value: reviewerProfileId },
      ],
      limit: 1,
    });

    if (error && !hasErrorCode(error, "PGRST116")) {
      throw error;
    }

    return data?.[0] ?? null;
  } catch (error) {
    logger.error("[reviews.queries] Error getting review by reviewer:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getReviewByReviewer",
      metadata: { reviewedProfileId, reviewerProfileId, type },
    });
    return null;
  }
}

/**
 * Buscar review por ID
 */
export async function getReviewById(
  reviewId: string,
  type: ReviewType,
): Promise<Review | null> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<Review>(table, {
      filters: [{ op: "eq", column: "id", value: reviewId }],
      limit: 1,
    });

    if (error && !hasErrorCode(error, "PGRST116")) {
      throw error;
    }

    return data?.[0] ?? null;
  } catch (error) {
    logger.error("[reviews.queries] Error getting review by id:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getReviewById",
      metadata: { reviewId, type },
    });
    return null;
  }
}

/**
 * Buscar todos os reviews de um profile (que foi avaliado)
 */
export async function getReviewsForProfile(
  profileId: string,
  type: ReviewType,
  limit = 50,
): Promise<ReviewWithProfiles[]> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<ReviewWithProfiles>(table, {
      columns: `
        *,
        reviewed_profile:profiles!reviewed_profile_id (
          id,
          name,
          avatar_url
        ),
        reviewer_profile:profiles!reviewer_profile_id (
          id,
          name,
          avatar_url
        )
      `,
      filters: [{ op: "eq", column: "reviewed_profile_id", value: profileId }],
      orderBy: { column: "created_at", ascending: false },
      limit,
    });

    if (error) throw error;

    return (data || []) as ReviewWithProfiles[];
  } catch (error) {
    logger.error("[reviews.queries] Error getting reviews for profile:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getReviewsForProfile",
      metadata: { profileId, type, limit },
    });
    return [];
  }
}

/**
 * Buscar reviews feitos por um profile (que avaliou outros)
 */
export async function getReviewsByReviewer(
  reviewerProfileId: string,
  type: ReviewType,
  limit = 50,
): Promise<ReviewWithProfiles[]> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<ReviewWithProfiles>(table, {
      columns: `
        *,
        reviewed_profile:profiles!reviewed_profile_id (
          id,
          name,
          avatar_url
        ),
        reviewer_profile:profiles!reviewer_profile_id (
          id,
          name,
          avatar_url
        )
      `,
      filters: [{ op: "eq", column: "reviewer_profile_id", value: reviewerProfileId }],
      orderBy: { column: "created_at", ascending: false },
      limit,
    });

    if (error) throw error;

    return (data || []) as ReviewWithProfiles[];
  } catch (error) {
    logger.error("[reviews.queries] Error getting reviews by reviewer:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getReviewsByReviewer",
      metadata: { reviewerProfileId, type, limit },
    });
    return [];
  }
}

/**
 * Buscar estatísticas de reviews de um profile
 */
export async function getReviewStats(
  profileId: string,
  type: ReviewType,
): Promise<ReviewStats> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<{ rating: number }>(table, {
      columns: "rating",
      filters: [{ op: "eq", column: "reviewed_profile_id", value: profileId }],
    });

    if (error) throw error;

    const reviews = data || [];
    const total = reviews.length;

    if (total === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0);
    const average = sum / total;

    const distribution = reviews.reduce(
      (acc: { 1: number; 2: number; 3: number; 4: number; 5: number }, review: { rating: number }) => {
        acc[review.rating as keyof typeof acc]++;
        return acc;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    );

    return {
      total,
      average: Math.round(average * 10) / 10,
      distribution,
      total_reviews: total,
      average_rating: Math.round(average * 10) / 10,
      rating_distribution: distribution,
    };
  } catch (error) {
    logger.error("[reviews.queries] Error getting review stats:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getReviewStats",
      metadata: { profileId, type },
    });
    return {
      total: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

/**
 * Buscar contagem de reviews de um profile (método leve)
 */
export async function getReviewCount(
  profileId: string,
  type: ReviewType,
): Promise<number> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<{ id: string }>(table, {
      columns: "id",
      filters: [{ op: "eq", column: "reviewed_profile_id", value: profileId }],
    });

    if (error) throw error;

    return data?.length ?? 0;
  } catch (error) {
    logger.error("[reviews.queries] Error getting review count:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getReviewCount",
      metadata: { profileId, type },
    });
    return 0;
  }
}

/**
 * Buscar todos os reviews de um tipo (admin)
 */
export async function getAllReviews(type: ReviewType, limit = 100): Promise<Review[]> {
  try {
    const table = getTableName(type);
    const { data, error } = await selectLooseRows<Review>(table, {
      columns: "id, reviewed_profile_id, reviewer_profile_id, rating, comment, created_at",
      orderBy: { column: "created_at", ascending: false },
      limit,
    });

    if (error) throw error;
    return (data || []) as Review[];
  } catch (error) {
    logger.error("[reviews.queries] Error getting all reviews:", error);
    trackError(error as Error, {
      component: "reviews.queries",
      action: "getAllReviews",
      metadata: { type, limit },
    });
    return [];
  }
}
