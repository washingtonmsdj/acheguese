/**
 * ⭐ REVIEWS MUTATIONS - SSOT v2.0
 *
 * Operações de escrita para reviews/avaliações.
 * Todas as mutations são pure functions que recebem dados e retornam resultado.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { insertLooseRow, updateLooseRows } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import type { Review, ReviewType, CreateReviewData } from "../types";
import { getReviewById, getReviewByReviewer } from "./reviews.queries";

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null }>;

interface QueryBuilder<TRow> {
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  then<TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface ReviewsDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const reviewsDb = supabase as unknown as ReviewsDbClient;

// ============================================================================
// 🔧 HELPERS
// ============================================================================

function getTableName(type: ReviewType): string {
  return type === "business" ? "business_reviews_new" : "professional_reviews_new";
}

function buildReviewInsertPayload(data: CreateReviewData) {
  return {
    reviewed_profile_id: data.reviewed_profile_id,
    reviewer_profile_id: data.reviewer_profile_id,
    rating: data.rating,
    comment: data.comment ?? null,
  };
}

function buildReviewUpdatePayload(
  updates: Partial<Pick<CreateReviewData, "rating" | "comment" | "job_type">>,
) {
  return {
    rating: updates.rating,
    comment: updates.comment,
  };
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

    const payload = buildReviewInsertPayload(data);
    const { error } = await insertLooseRow(table, payload);

    if (error) throw error;

    const review = await getReviewByReviewer(
      data.reviewed_profile_id,
      data.reviewer_profile_id,
      type,
    );
    if (!review) {
      throw new Error("Review inserted but could not be reloaded");
    }

    logger.info("[reviews.mutations] Review added:", {
      reviewed: data.reviewed_profile_id,
      reviewer: data.reviewer_profile_id,
      rating: data.rating,
      type,
    });

    return review;
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

    const payload = buildReviewUpdatePayload(updates);
    const { error } = await updateLooseRows(
      table,
      payload as Record<string, unknown>,
      [{ column: "id", value: reviewId }],
    );

    if (error) throw error;

    const review = await getReviewById(reviewId, type);
    if (!review) {
      throw new Error("Review updated but could not be reloaded");
    }

    logger.info("[reviews.mutations] Review updated:", { reviewId, updates, type });

    return review;
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
    const { error } = await reviewsDb
      .from<unknown>(table)
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
