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
}

export interface CreateReviewData {
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  [key: string]: any;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  [key: string]: any;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
}
