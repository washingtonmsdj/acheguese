// @ts-nocheck
/**
 * ⭐ REVIEWS MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para reviews/avaliações.
 * Todas as mutations são pure functions que recebem dados e retornam resultado.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { Review, ReviewType, CreateReviewData } from "../types";

// ============================================================================
// 🔧 HELPERS
// ============================================================================

function getTableName(type: ReviewType): string {
  return type === "business" ? "business_reviews_new" : "professional_reviews_new";
}

// ============================================================================
// ✏️ MUTATION OPERATIONS
// ============================================================================

/**
 * Adicionar novo review
 */
export async function addReview(
  data: CreateReviewData,
  type: ReviewType,
): Promise<Review> {
  try {
    const table = getTableName(type);

    const { data: review, error } = await (supabase as any)
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    logger.info("[reviews.mutations] Review added:", {
      reviewed: data.reviewed_profile_id,
      reviewer: data.reviewer_profile_id,
      rating: data.rating,
      type,
    });

    return review as Review;
  } catch (error) {
    logger.error("[reviews.mutations] Error adding review:", error);
    trackError(error as Error, {
      component: "reviews.mutations",
      action: "addReview",
      metadata: { reviewedId: data.reviewed_profile_id, type },
    });
    throw error;
  }
}

/**
 * Atualizar review existente
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<Pick<CreateReviewData, "rating" | "comment" | "job_type">>,
  type: ReviewType,
): Promise<Review> {
  try {
    const table = getTableName(type);

    const { data: review, error } = await (supabase as any)
      .from(table)
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;

    logger.info("[reviews.mutations] Review updated:", { reviewId, updates, type });

    return review as Review;
  } catch (error) {
    logger.error("[reviews.mutations] Error updating review:", error);
    trackError(error as Error, {
      component: "reviews.mutations",
      action: "updateReview",
      metadata: { reviewId, type },
    });
    throw error;
  }
}

/**
 * Remover review
 */
export async function removeReview(reviewId: string, type: ReviewType): Promise<boolean> {
  try {
    const table = getTableName(type);

    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq("id", reviewId);

    if (error) throw error;

    logger.info("[reviews.mutations] Review removed:", { reviewId, type });

    return true;
  } catch (error) {
    logger.error("[reviews.mutations] Error removing review:", error);
    trackError(error as Error, {
      component: "reviews.mutations",
      action: "removeReview",
      metadata: { reviewId, type },
    });
    throw error;
  }
}

/**
 * Criar ou atualizar review (upsert)
 * Delega para queries.hasReviewed e mutations.addReview/updateReview
 */
export async function upsertReview(
  data: CreateReviewData,
  type: ReviewType,
): Promise<{ review: Review; isNew: boolean }> {
  // Dynamic import para evitar circular dependency
  const { hasReviewed, getReviewByReviewer } = await import("./reviews.queries");

  try {
    // Verificar se já existe
    const existing = await getReviewByReviewer(
      data.reviewed_profile_id,
      data.reviewer_profile_id,
      type,
    );

    if (existing) {
      // Atualizar existente
      const updated = await updateReview(
        existing.id,
        {
          rating: data.rating,
          comment: data.comment,
          job_type: data.job_type,
        },
        type,
      );

      return {
        review: updated,
        isNew: false,
      };
    } else {
      // Criar novo
      const created = await addReview(data, type);

      return {
        review: created,
        isNew: true,
      };
    }
  } catch (error) {
    logger.error("[reviews.mutations] Error upserting review:", error);
    trackError(error as Error, {
      component: "reviews.mutations",
      action: "upsertReview",
      metadata: { reviewedId: data.reviewed_profile_id, type },
    });
    throw error;
  }
}
