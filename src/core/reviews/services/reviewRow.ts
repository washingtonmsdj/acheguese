import type { Tables } from "@/integrations/supabase";
import type { Review, ReviewProfileRef, ReviewType } from "../types";

export type ReviewRow = Tables<"reviews">;
export type ProfileRow = Pick<
  Tables<"profiles">,
  "id" | "name" | "avatar_url"
>;

export function normalizeReviewProfile(
  profile: ProfileRow | null,
): ReviewProfileRef | null {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    avatar_url: profile.avatar_url,
  };
}

export function normalizeReviewRow(row: ReviewRow): Review {
  return {
    id: row.id,
    reviewed_profile_id: row.reviewed_profile_id,
    reviewer_profile_id: row.reviewer_profile_id,
    rating: row.rating,
    comment: row.comment,
    review_type: row.review_type as ReviewType,
    status: row.status,
    photos: row.photos ?? [],
    business_response: row.business_response,
    business_response_at: row.business_response_at,
    order_id: row.order_id,
    helpful_count: row.helpful_count,
    not_helpful_count: row.not_helpful_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
