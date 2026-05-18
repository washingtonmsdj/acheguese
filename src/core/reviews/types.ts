/**
 * Reviews Types
 */

export type ReviewType = "business" | "professional";

export interface Review {
  id: string;
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ReviewProfileRef {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
}

export interface ReviewWithProfiles extends Review {
  reviewed_profile?: ReviewProfileRef | null;
  reviewer_profile?: ReviewProfileRef | null;
}

export interface CreateReviewData {
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  [key: string]: unknown;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  [key: string]: unknown;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
  total_reviews?: number;
  average_rating?: number;
  rating_distribution?: Record<number, number>;
}
