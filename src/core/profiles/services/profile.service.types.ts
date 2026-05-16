import type { BannedUser } from "./types";

export type VerificationWorkflowStatus = "pending" | "verified" | "rejected" | "none";
export type BannedUserLike = BannedUser | null;
export type UserSubscriptionLike = {
  active?: boolean | null;
  plan_type?: string | null;
  expires_at?: string | null;
} | null;
export type ProfileWithAlertBanRow = {
  id: string;
  alert_banned?: boolean | null;
  neighborhood?: string | null;
  created_at?: string | null;
};
export type BusinessRow = {
  profile_id: string;
  business_name: string;
  metadata?: { logo_url?: string | null } | null;
  logo?: string | null;
  category?: string | null;
  rating?: number | null;
  profiles?: { neighborhood?: string | null; city?: string | null } | null;
  is_verified?: boolean | null;
  verified?: boolean | null;
  slug?: string | null;
  geographic_path?: string | null;
  is_premium?: boolean | null;
  aberto?: boolean | null;
  description?: string | null;
};
export type RecentProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};
export type ProfileSummaryRow = {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  verified?: boolean | null;
};
export type ProfileSummaryExtendedRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  verified?: boolean | null;
  username?: string | null;
  public_neighborhood?: string | null;
  public_city?: string | null;
  public_state?: string | null;
};
export type AdminProfileListRow = {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  verified?: boolean | null;
  is_suspended?: boolean | null;
  created_at: string;
  profile_type: string;
};
export type ProfileFilterRow = {
  id: string;
  user_id: string;
  created_at: string;
  profile_type: string;
  is_public?: boolean | null;
  username?: string | null;
  name?: string | null;
  display_name?: string | null;
};
export type ActiveRideIdRow = { active_ride_id: string | null };
export type RideProfileRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  city?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  pontos?: number | null;
  telefone?: string | null;
};
export type UserListRow = {
  id: string;
  name: string;
  avatar_url?: string | null;
  is_active?: boolean | null;
  is_suspended?: boolean | null;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  suspended_until?: string | null;
  verified?: boolean | null;
  reputation?: number | null;
};
export type ProfileIdRow = { id: string };
export type RankingRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  pontos: number | null;
};
export type MentionRow = {
  id: string;
  rank: number;
  created_at: string;
  post: {
    id: string;
    type: string;
    content: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    author: { id: string; name: string; avatar_url: string | null };
  };
};
export type PassengerRatingRow = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  passenger_rating: number | null;
  passenger_trust_level: string | null;
  passenger_completed_rides: number | null;
};
