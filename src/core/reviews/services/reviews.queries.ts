import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type {
  Review,
  ReviewStats,
  ReviewType,
  ReviewWithProfiles,
  ReviewAggregate,
} from "../types";
import {
  normalizeReviewProfile,
  normalizeReviewRow,
  type ProfileRow,
  type ReviewRow,
} from "./reviewRow";

type ReviewWithProfilesRow = ReviewRow & {
  reviewed_profile: ProfileRow | null;
  reviewer_profile: ProfileRow | null;
};

const REVIEW_COLUMNS =
  "id,reviewed_profile_id,reviewer_profile_id,rating,comment,review_type,status,photos,business_response,business_response_at,order_id,helpful_count,not_helpful_count,created_at,updated_at" as const;

const REVIEW_WITH_PROFILES_COLUMNS = `
  ${REVIEW_COLUMNS},
  reviewed_profile:profiles!reviews_reviewed_profile_id_fkey (
    id,
    name,
    avatar_url
  ),
  reviewer_profile:profiles!reviews_reviewer_profile_id_fkey (
    id,
    name,
    avatar_url
  )
`;

function normalizeLimit(limit: number, maximum = 100): number {
  if (!Number.isFinite(limit)) return Math.min(50, maximum);
  return Math.min(Math.max(Math.trunc(limit), 1), maximum);
}

function normalizeReviewWithProfiles(
  row: ReviewWithProfilesRow,
): ReviewWithProfiles {
  return {
    ...normalizeReviewRow(row),
    reviewed_profile: normalizeReviewProfile(row.reviewed_profile),
    reviewer_profile: normalizeReviewProfile(row.reviewer_profile),
  };
}

function failQuery(
  action: string,
  error: unknown,
  metadata: Record<string, unknown>,
): never {
  logger.error(`[reviews.queries] ${action} failed`, error, metadata);
  trackError(error instanceof Error ? error : new Error(String(error)), {
    component: "reviews.queries",
    action,
    metadata,
  });
  throw error;
}

function emptyDistribution(): Record<number, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function parseReviewStats(value: unknown): ReviewStats {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const rawDistribution =
    record.distribution && typeof record.distribution === "object"
      ? (record.distribution as Record<string, unknown>)
      : {};
  const distribution = emptyDistribution();

  for (let rating = 1; rating <= 5; rating += 1) {
    distribution[rating] = Number(rawDistribution[String(rating)] ?? 0);
  }

  const total = Number(record.total ?? 0);
  const average = Number(record.average ?? 0);

  return {
    total,
    average,
    distribution,
    total_reviews: total,
    average_rating: average,
    rating_distribution: distribution,
  };
}

export async function hasReviewed(
  reviewedProfileId: string,
  reviewerProfileId: string,
  type: ReviewType,
): Promise<boolean> {
  return Boolean(
    await getReviewByReviewer(reviewedProfileId, reviewerProfileId, type),
  );
}

export async function getReviewByReviewer(
  reviewedProfileId: string,
  reviewerProfileId: string,
  type: ReviewType,
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("reviewed_profile_id", reviewedProfileId)
    .eq("reviewer_profile_id", reviewerProfileId)
    .eq("review_type", type)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    failQuery("getReviewByReviewer", error, {
      reviewedProfileId,
      reviewerProfileId,
      type,
    });
  }

  return data ? normalizeReviewRow(data as ReviewRow) : null;
}

export async function getReviewById(
  reviewId: string,
  type: ReviewType,
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("id", reviewId)
    .eq("review_type", type)
    .eq("status", "active")
    .maybeSingle();

  if (error) failQuery("getReviewById", error, { reviewId, type });
  return data ? normalizeReviewRow(data as ReviewRow) : null;
}

export async function getReviewsForProfile(
  profileId: string,
  type: ReviewType,
  limit = 50,
): Promise<ReviewWithProfiles[]> {
  const boundedLimit = normalizeLimit(limit);
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_WITH_PROFILES_COLUMNS)
    .eq("reviewed_profile_id", profileId)
    .eq("review_type", type)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(boundedLimit);

  if (error) {
    failQuery("getReviewsForProfile", error, {
      profileId,
      type,
      limit: boundedLimit,
    });
  }

  return ((data ?? []) as unknown as ReviewWithProfilesRow[]).map(
    normalizeReviewWithProfiles,
  );
}

export async function getReviewsByReviewer(
  reviewerProfileId: string,
  type: ReviewType,
  limit = 50,
): Promise<ReviewWithProfiles[]> {
  const boundedLimit = normalizeLimit(limit);
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_WITH_PROFILES_COLUMNS)
    .eq("reviewer_profile_id", reviewerProfileId)
    .eq("review_type", type)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(boundedLimit);

  if (error) {
    failQuery("getReviewsByReviewer", error, {
      reviewerProfileId,
      type,
      limit: boundedLimit,
    });
  }

  return ((data ?? []) as unknown as ReviewWithProfilesRow[]).map(
    normalizeReviewWithProfiles,
  );
}

export async function getReviewStats(
  profileId: string,
  type: ReviewType,
): Promise<ReviewStats> {
  const { data, error } = await supabase.rpc("get_profile_review_stats", {
    p_review_type: type,
    p_reviewed_profile_id: profileId,
  });

  if (error) failQuery("getReviewStats", error, { profileId, type });
  return parseReviewStats(data);
}

export async function getReviewCount(
  profileId: string,
  type: ReviewType,
): Promise<number> {
  const stats = await getReviewStats(profileId, type);
  return stats.total;
}

export async function getAllReviews(
  type: ReviewType,
  limit = 100,
): Promise<Review[]> {
  const boundedLimit = normalizeLimit(limit, 200);
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .eq("review_type", type)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(boundedLimit);

  if (error) {
    failQuery("getAllReviews", error, {
      type,
      limit: boundedLimit,
    });
  }

  return ((data ?? []) as ReviewRow[]).map(normalizeReviewRow);
}

export async function getReviewAggregatesAdmin(
  profileIds: string[],
  type: ReviewType,
): Promise<ReviewAggregate[]> {
  const uniqueProfileIds = [...new Set(profileIds)];
  if (uniqueProfileIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let index = 0; index < uniqueProfileIds.length; index += 200) {
    chunks.push(uniqueProfileIds.slice(index, index + 200));
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      supabase.rpc("get_review_aggregates_admin", {
        p_profile_ids: chunk,
        p_review_type: type,
      }),
    ),
  );

  const error = responses.find((response) => response.error)?.error;
  if (error) {
    failQuery("getReviewAggregatesAdmin", error, {
      profileCount: uniqueProfileIds.length,
      type,
    });
  }

  const rows = responses.flatMap((response) => response.data ?? []);

  return rows.map((row) => ({
    profile_id: row.reviewed_profile_id,
    count: row.review_count,
    average: row.average_rating === null ? null : Number(row.average_rating),
  }));
}
