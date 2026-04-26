/**
 * Tipos para o sistema de gamificação
 */

export type UserQuestStatus = "active" | "completed" | "failed" | "expired";
export type UserRewardStatus = "active" | "used" | "expired";

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points_reward: number;
  requirements: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress: number;
  badge?: Badge;
}

export interface Quest {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  points_reward: number;
  experience_reward: number;
  requirements: Record<string, any>;
  duration_days?: number;
  is_active: boolean;
  created_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  status: UserQuestStatus;
  progress: number;
  started_at: string;
  completed_at?: string;
  expires_at?: string;
}

export interface Reward {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "points" | "badge" | "item" | "discount" | "feature";
  value: Record<string, any>;
  cost_points: number;
  is_active: boolean;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  claimed_at: string;
  used_at?: string;
  expires_at?: string;
  status: UserRewardStatus;
}

export interface Streak {
  user_id: string;
  streak_type: string;
  current_count: number;
  best_count: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  rank: number;
  profile?: {
    name: string;
    avatar_url: string;
  };
}

export interface GamificationStats {
  total_points: number;
  level: number;
  experience_points: number;
  badges_count: number;
  achievements_count: number;
  quests_completed: number;
  current_streak: number;
  longest_streak: number;
  rank?: number;
}
