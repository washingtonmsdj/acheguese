import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { CreateReviewData, Review, ReviewType } from "../types";
import { normalizeReviewRow, type ReviewRow } from "./reviewRow";

interface UpsertProfileReviewResponse {
  review: ReviewRow;
  isNew: boolean;
}

function assertProfessionalReview(type: ReviewType): void {
  if (type !== "professional") {
    throw new Error(
      "Business and service reviews must use their domain policy adapter",
    );
  }
}

function parseUpsertResponse(value: unknown): UpsertProfileReviewResponse {
  if (!value || typeof value !== "object") {
    throw new Error("Profile review command returned an invalid response");
  }

  const response = value as Record<string, unknown>;
  if (
    !response.review ||
    typeof response.review !== "object" ||
    typeof response.isNew !== "boolean"
  ) {
    throw new Error("Profile review command returned an invalid response");
  }

  return {
    review: response.review as unknown as ReviewRow,
    isNew: response.isNew,
  };
}

export function normalizeUpsertReviewCommandResponse(value: unknown): {
  review: Review;
  isNew: boolean;
} {
  const response = parseUpsertResponse(value);
  return {
    review: normalizeReviewRow(response.review),
    isNew: response.isNew,
  };
}

function failMutation(
  action: string,
  error: unknown,
  metadata: Record<string, unknown>,
): never {
  logger.error(`[reviews.mutations] ${action} failed`, error, metadata);
  trackError(error instanceof Error ? error : new Error(String(error)), {
    component: "reviews.mutations",
    action,
    metadata,
  });
  throw error;
}

export async function upsertReview(
  data: CreateReviewData,
  type: ReviewType,
): Promise<{ review: Review; isNew: boolean }> {
  assertProfessionalReview(type);

  const { data: commandResult, error } = await supabase.rpc(
    "upsert_profile_review",
    {
      p_comment: data.comment?.trim() || undefined,
      p_rating: data.rating,
      p_reviewed_profile_id: data.reviewed_profile_id,
      p_reviewer_profile_id: data.reviewer_profile_id,
    },
  );

  if (error) {
    failMutation("upsertReview", error, {
      reviewedProfileId: data.reviewed_profile_id,
      reviewerProfileId: data.reviewer_profile_id,
      type,
    });
  }

  return normalizeUpsertReviewCommandResponse(commandResult);
}

export async function removeReview(
  reviewId: string,
  type: ReviewType,
  reviewerProfileId?: string | null,
): Promise<boolean> {
  assertProfessionalReview(type);

  const { data, error } = await supabase.rpc("delete_profile_review", {
    p_review_id: reviewId,
    p_reviewer_profile_id: reviewerProfileId ?? null,
  });

  if (error) {
    failMutation("removeReview", error, { reviewId, type });
  }
  if (data !== true) {
    throw new Error("Review not found or deletion was not authorized");
  }

  return true;
}
