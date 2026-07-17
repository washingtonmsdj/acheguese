export type ReviewType = "business" | "professional" | "service";

export type ReviewStatus = string;

export interface Review {
  id: string;
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment: string | null;
  review_type: ReviewType;
  status: ReviewStatus;
  photos: string[];
  business_response: string | null;
  business_response_at: string | null;
  order_id: string | null;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewProfileRef {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface ReviewWithProfiles extends Review {
  reviewed_profile: ReviewProfileRef | null;
  reviewer_profile: ReviewProfileRef | null;
}

export interface CreateReviewData {
  reviewed_profile_id: string;
  reviewer_profile_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
}

export interface ReviewAggregate {
  profile_id: string;
  count: number;
  average: number | null;
}

export interface ReviewHelpfulnessVote {
  id: string;
  review_id: string;
  voter_profile_id: string;
  is_helpful: boolean;
  created_at: string;
  updated_at: string;
}

export type ReviewReportReason =
  | "spam"
  | "offensive"
  | "fake"
  | "inappropriate"
  | "other";
