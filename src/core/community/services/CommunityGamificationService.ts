import { GamificationService } from "@/core/gamification/services/GamificationService";
import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { FlexibleMetadata } from "@/shared/types/supabase.types";
import type {
  CommunityInteraction,
  CommunityProfile,
  CommunityStats,
  EngagementScoreEntry,
  InteractionType,
  UserBadge,
  UserLevel,
} from "./community.types";

const db = supabase as any;

interface PostgresError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  status?: number;
}

function isPostgresError(error: unknown): error is PostgresError {
  return typeof error === "object" && error !== null && "code" in error;
}

function isTableNotFoundError(error: unknown): boolean {
  if (!isPostgresError(error)) return false;
  const code = error.code;
  const message = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  const status = typeof error.status === "number" ? error.status : null;

  if (code === "PGRST204" || code === "PGRST116" || code === "42P01") return true;
  if (status === 404) return true;
  if (message.includes("relation") && message.includes("does not exist")) return true;
  if (message.includes("table") && message.includes("not found")) return true;
  if (message.includes("community_profiles") && message.includes("not")) return true;
  return false;
}

const INTERACTION_POINTS: Record<InteractionType, number> = {
  post_created: 10,
  comment_added: 5,
  helpful_vote: 2,
  review_written: 15,
  recommendation_made: 8,
  event_attended: 12,
  business_created: 50,
  service_offered: 30,
  ride_completed: 20,
  profile_completed: 25,
};

const BADGE_REQUIREMENTS = {
  helpful_neighbor: {
    interaction_type: "helpful_vote",
    count: 10,
  },
  active_member: {
    total_interactions: 50,
  },
  trusted_reviewer: {
    interaction_type: "review_written",
    count: 5,
  },
  local_expert: {
    total_points: 500,
  },
  community_leader: {
    total_points: 1000,
  },
  expert_reviewer: {
    interaction_type: "review_written",
    count: 100,
  },
  content_creator: {
    interaction_type: "post_created",
    count: 100,
  },
  super_helper: {
    interaction_type: "helpful_vote",
    count: 100,
  },
  highly_recommended: {
    reviews_count: 50,
    min_rating: 4.0,
  },
} as const;

function getInteractionPoints(interactionType: InteractionType): number {
  return INTERACTION_POINTS[interactionType] ?? 0;
}

class CommunityGamificationServiceClass {
  private static readonly LEADERBOARD_TABLE_FLAG_KEY = "community.leaderboard_table_available";
  private leaderboardTableAvailable: boolean | null = this.readLeaderboardTableFlag();

  private readLeaderboardTableFlag(): boolean | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(CommunityGamificationServiceClass.LEADERBOARD_TABLE_FLAG_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return null;
  }

  private writeLeaderboardTableFlag(value: boolean): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(CommunityGamificationServiceClass.LEADERBOARD_TABLE_FLAG_KEY, value ? "true" : "false");
  }

  async recordInteraction(
    userId: string,
    interactionType: InteractionType,
    targetType?: string,
    targetId?: string,
    metadata?: FlexibleMetadata,
  ): Promise<{
    success: boolean;
    interaction?: CommunityInteraction;
    points?: number;
    error?: string;
  }> {
    try {
      const points = getInteractionPoints(interactionType);

      const { data: interaction, error } = await db
        .from("community_interactions")
        .insert({
          user_id: userId,
          interaction_type: interactionType,
          target_type: targetType,
          target_id: targetId,
          points,
          metadata,
        })
        .select()
        .single();

      if (error) {
        trackError(error, {
          component: "CommunityGamificationService",
          action: "recordInteraction",
        });
        return { success: false, error: error.message };
      }

      await this.checkAndAwardBadges(userId);
      return { success: true, interaction, points };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGamificationService",
        action: "recordInteraction",
      });
      return { success: false, error: (error as Error).message };
    }
  }

  async getUserStats(userId: string): Promise<CommunityStats> {
    try {
      const { data: interactions, error } = await db
        .from("community_interactions")
        .select("interaction_type, points")
        .eq("user_id", userId);

      if (error) {
        if (error.code === "PGRST204" || error.code === "PGRST116" || error.code === "42P01") {
          return {
            totalInteractions: 0,
            totalPoints: 0,
            interactionsByType: {},
          };
        }
        trackError(error, {
          component: "CommunityGamificationService",
          action: "getUserStats",
        });
        return { totalInteractions: 0, totalPoints: 0, interactionsByType: {} };
      }

      const totalInteractions = interactions?.length || 0;
      const totalPoints = interactions?.reduce((sum, i) => sum + (i.points || 0), 0) || 0;
      const interactionsByType: Record<string, number> = {};

      interactions?.forEach((i) => {
        interactionsByType[i.interaction_type] = (interactionsByType[i.interaction_type] || 0) + 1;
      });

      return { totalInteractions, totalPoints, interactionsByType };
    } catch (error) {
      if (!isTableNotFoundError(error)) {
        trackError(error as Error, {
          component: "CommunityGamificationService",
          action: "getUserStats",
        });
      }
      return { totalInteractions: 0, totalPoints: 0, interactionsByType: {} };
    }
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      const earnedAchievements = await GamificationService.getUserAchievements(userId);
      const earnedCodes = new Set<string>(earnedAchievements.map((a) => a.achievement_code));

      for (const [badgeCode, requirement] of Object.entries(BADGE_REQUIREMENTS)) {
        if (earnedCodes.has(badgeCode)) continue;
        let shouldAward = false;

        if ("interaction_type" in requirement) {
          const count = stats.interactionsByType[requirement.interaction_type] || 0;
          shouldAward = count >= requirement.count;
        } else if ("total_interactions" in requirement) {
          shouldAward = stats.totalInteractions >= requirement.total_interactions;
        } else if ("total_points" in requirement) {
          shouldAward = stats.totalPoints >= requirement.total_points;
        }

        if (shouldAward) {
          await this.awardBadge(userId, badgeCode);
        }
      }
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGamificationService",
        action: "checkAndAwardBadges",
      });
    }
  }

  async awardBadge(
    userId: string,
    badgeCode: string,
  ): Promise<{
    success: boolean;
    badgeCode?: string;
    alreadyEarned?: boolean;
    error?: string;
  }> {
    try {
      const { data: badge, error } = await db
        .from("community_badges")
        .select("id")
        .eq("code", badgeCode)
        .single();

      if (error || !badge) {
        trackError(new Error(`Badge ${badgeCode} not found`), {
          component: "CommunityGamificationService",
          action: "awardBadge",
        });
        return { success: false, error: "Badge not found" };
      }

      const success = await GamificationService.grantAchievement(userId, badgeCode);
      if (!success) {
        return { success: true, alreadyEarned: true };
      }

      return { success: true, badgeCode };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGamificationService",
        action: "awardBadge",
      });
      return { success: false, error: (error as Error).message };
    }
  }

  async getAvailableBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data: allBadges, error } = await db
        .from("community_badges")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error || !allBadges) {
        trackError(error || new Error("No badges found"), {
          component: "CommunityGamificationService",
          action: "getAvailableBadges",
        });
        return [];
      }

      const userAchievements = await GamificationService.getUserAchievements(userId);
      const userBadgesMap = new Map(userAchievements.map((ua) => [ua.achievement_code, ua]));

      return allBadges.map((badge) => {
        const userAchievement = userBadgesMap.get(badge.code);
        return {
          ...badge,
          earned_at: userAchievement?.earned_at || undefined,
          progress: userAchievement?.progress || 0,
          is_earned: !!userAchievement?.earned_at,
        };
      });
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityGamificationService",
        action: "getAvailableBadges",
      });
      return [];
    }
  }

  async getLeaderboard(limit: number = 10): Promise<CommunityProfile[]> {
    if (this.leaderboardTableAvailable === false) {
      return [];
    }

    try {
      const { data, error } = await db
        .from("community_profiles")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) {
        if (isTableNotFoundError(error)) {
          this.leaderboardTableAvailable = false;
          this.writeLeaderboardTableFlag(false);
          logger.warn("[CommunityGamificationService] community_profiles not available; returning empty leaderboard");
          return [];
        }
        trackError(error, {
          component: "CommunityGamificationService",
          action: "getLeaderboard",
        });
        return [];
      }

      this.leaderboardTableAvailable = true;
      this.writeLeaderboardTableFlag(true);
      return data || [];
    } catch (error) {
      if (isTableNotFoundError(error)) {
        this.leaderboardTableAvailable = false;
        this.writeLeaderboardTableFlag(false);
        logger.warn("[CommunityGamificationService] community_profiles not available; returning empty leaderboard");
        return [];
      }
      trackError(error as Error, {
        component: "CommunityGamificationService",
        action: "getLeaderboard",
      });
      return [];
    }
  }

  async getEngagementRanking(
    entityType: string,
    options?: {
      periodStart?: string;
      limit?: number;
    },
  ): Promise<EngagementScoreEntry[]> {
    const periodStart = options?.periodStart;
    const limit = options?.limit ?? 10;

    try {
      let query = db
        .from("civic_engagement_scores")
        .select("*")
        .eq("entity_type", entityType)
        .order("total_score", { ascending: false });

      if (periodStart) {
        query = query.gte("period_start", periodStart);
      }

      const { data, error } = await query.limit(limit);
      if (error) {
        if (isTableNotFoundError(error)) return [];
        trackError(error, {
          component: "CommunityGamificationService",
          action: "getEngagementRanking",
          metadata: { entityType, periodStart, limit },
        });
        return [];
      }

      return (data || []) as EngagementScoreEntry[];
    } catch (error) {
      if (!isTableNotFoundError(error)) {
        trackError(error as Error, {
          component: "CommunityGamificationService",
          action: "getEngagementRanking",
          metadata: { entityType, periodStart, limit },
        });
      }
      return [];
    }
  }

  getUserLevel(totalPoints: number): UserLevel {
    const levels = [
      { level: "bronze", name: "Bronze", icon: "🥉", color: "#CD7F32", minPoints: 0, maxPoints: 100 },
      { level: "silver", name: "Prata", icon: "🥈", color: "#C0C0C0", minPoints: 100, maxPoints: 500 },
      { level: "gold", name: "Ouro", icon: "🥇", color: "#FFD700", minPoints: 500, maxPoints: 1000 },
      { level: "platinum", name: "Platina", icon: "💎", color: "#E5E4E2", minPoints: 1000, maxPoints: 5000 },
      { level: "diamond", name: "Diamante", icon: "💎", color: "#B9F2FF", minPoints: 5000, maxPoints: Infinity },
    ];

    const currentLevel =
      levels.find((l) => totalPoints >= l.minPoints && totalPoints < l.maxPoints) || levels[0];
    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentIndex + 1] || currentLevel;

    const progress =
      nextLevel.maxPoints === Infinity
        ? 100
        : Math.min(
            ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100,
            100,
          );

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      icon: currentLevel.icon,
      color: currentLevel.color,
      nextLevel: nextLevel.name,
      nextLevelPoints: nextLevel.minPoints,
      progress: Math.round(progress),
    };
  }
}

export const CommunityGamificationService = new CommunityGamificationServiceClass();
