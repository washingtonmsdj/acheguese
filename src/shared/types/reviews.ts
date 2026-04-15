/**
 * GATE 3 - FASE 3B: Types para o novo modelo de reviews
 * Tipos centralizados para business e professional reviews
 */

export interface Review {
  id: string;
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  job_type?: string; // Para professional reviews
  created_at: string;
  updated_at: string;
}

export interface ReviewWithProfiles extends Review {
  reviewed_profile: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  reviewer_profile: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface CreateReviewData {
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
  job_type?: string; // Para professional reviews
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export type ReviewType = "business" | "professional";

export interface ReviewQuery {
  reviewed_profile_id?: string;
  reviewer_profile_id?: string;
  rating?: number;
  limit?: number;
  offset?: number;
}
