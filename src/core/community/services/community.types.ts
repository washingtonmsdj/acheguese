import type { FlexibleMetadata } from "@/shared/types/supabase.types";

export type InteractionType =
  | "post_created"
  | "comment_added"
  | "helpful_vote"
  | "review_written"
  | "recommendation_made"
  | "event_attended"
  | "business_created"
  | "service_offered"
  | "ride_completed"
  | "profile_completed";

export interface CommunityProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  public_city?: string;
  public_neighborhood?: string;
  total_points: number;
  total_interactions: number;
  badges_count: number;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityInteraction {
  id: string;
  user_id: string;
  interaction_type: InteractionType;
  target_type?: string;
  target_id?: string;
  points: number;
  metadata?: FlexibleMetadata;
  created_at: string;
}

export interface CommunityBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface UserBadge extends CommunityBadge {
  earned_at?: string;
  progress: number;
  is_earned: boolean;
}

export interface CommunityStats {
  totalInteractions: number;
  totalPoints: number;
  interactionsByType: Record<string, number>;
}

export interface UserLevel {
  level: string;
  name: string;
  icon: string;
  color: string;
  nextLevel: string;
  nextLevelPoints: number;
  progress: number;
}

export interface EngagementScoreEntry {
  entity_name: string;
  total_score: number;
  rua?: string;
  neighborhood?: string;
  entity_type?: string;
  period_start?: string;
}
