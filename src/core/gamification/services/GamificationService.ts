/**
 * GamificationService - SSOT for user points, levels, achievements, and leaderboards.
 */

import { PAGINATION } from "@/shared/constants";
import { trackError } from "@/shared/utils/errorTracking";
import { supabase } from "@/integrations/supabase";

interface PostgresError {
  code?: string;
  message: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return typeof error === "object" && error !== null && "code" in error;
}

function isTableNotFoundError(error: unknown): boolean {
  if (!isPostgresError(error)) return false;
  const code = error.code;
  return code === "PGRST204" || code === "PGRST116" || code === "42P01";
}

export interface UserLevel {
  user_id: string;
  level: number;
  experience_points: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points_reward: number;
  requirements: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achievement_code: string;
  earned_at?: string;
  progress: number;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  transaction_type: "earned" | "spent" | "bonus" | "penalty";
  source: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TopUserByLocation {
  id: string;
  name: string;
  avatar_url?: string | null;
  reputation?: number | null;
}

interface LeaderboardRow {
  user_id: string;
  total_points: number;
  level: number;
  profiles?: { name?: string; avatar_url?: string } | null;
}

interface UserAchievementQueryRow {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at?: string | null;
  progress: number;
  achievement?: { code?: string } | null;
}

interface AchievementRewardRow {
  id: string;
  points_reward: number;
}

interface TopUsersByLocationRpcRow {
  id?: string;
  name?: string;
  avatar_url?: string | null;
  reputation?: number | null;
}

export interface UserGamificationStats {
  level: number;
  total_points: number;
  experience_points: number;
  achievements_count: number;
  achievements_total: number;
  recent_transactions: PointTransaction[];
  level_progress: number;
  points_to_next_level: number;
  current_streak: number;
  longest_streak: number;
}

interface QueryResult<T> {
  data: T | null;
  error: PostgresError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (columns: string) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  single: () => Promise<QueryResult<TRow>>;
}

interface TableClient<TRow> {
  select: (columns: string) => QueryBuilder<TRow>;
  insert: (payload: Record<string, unknown>) => Promise<QueryResult<null>>;
}

interface GamificationDbClient {
  from: <TRow = never>(table: string) => TableClient<TRow>;
  rpc: <TResult = unknown>(
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<QueryResult<TResult>>;
}

const db = supabase as unknown as GamificationDbClient;

function normalizeTopUsersByLocation(rows: TopUsersByLocationRpcRow[] | null): TopUserByLocation[] {
  return (rows ?? [])
    .map((row): TopUserByLocation | null => {
      if (!row.id || !row.name) return null;
      return {
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url ?? null,
        reputation: row.reputation ?? 0,
      };
    })
    .filter((row): row is TopUserByLocation => row !== null);
}

export class GamificationService {
  static async getUserLevel(userId: string): Promise<UserLevel | null> {
    try {
      const { data, error } = await db
        .from<UserLevel>("user_levels")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "getUserLevel",
        metadata: { userId },
      });
      return null;
    }
  }

  static async addPoints(
    userId: string,
    points: number,
    source: string,
    description: string,
    metadata: Record<string, unknown> = {},
  ): Promise<boolean> {
    try {
      const { error: transactionError } = await db.from("point_transactions").insert({
        user_id: userId,
        points,
        transaction_type: "earned",
        source,
        description,
        metadata,
      });

      if (transactionError) throw transactionError;

      const { error: levelError } = await db.rpc("update_user_level", {
        p_user_id: userId,
        p_points: points,
      });

      if (levelError) throw levelError;
      return true;
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "addPoints",
        metadata: { userId, points, source },
      });
      return false;
    }
  }

  static async getAvailableAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await db
        .from<Achievement>("achievements")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error) {
        if (isTableNotFoundError(error)) return [];
        throw error;
      }

      return data ?? [];
    } catch (error) {
      if (!isTableNotFoundError(error)) {
        trackError(error as Error, {
          component: "GamificationService",
          action: "getAvailableAchievements",
        });
      }
      return [];
    }
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await db
        .from<UserAchievementQueryRow>("user_achievements")
        .select(`
          *,
          achievement:achievements(code)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) {
        if (isTableNotFoundError(error)) return [];
        throw error;
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        achievement_id: row.achievement_id,
        achievement_code: row.achievement?.code ?? row.achievement_id,
        earned_at: row.earned_at ?? undefined,
        progress: row.progress,
      }));
    } catch (error) {
      if (!isTableNotFoundError(error)) {
        trackError(error as Error, {
          component: "GamificationService",
          action: "getUserAchievements",
          userId,
        });
      }
      return [];
    }
  }

  static async grantAchievement(userId: string, achievementCode: string): Promise<boolean> {
    try {
      const { data: achievement, error: achievementError } = await db
        .from<AchievementRewardRow>("achievements")
        .select("id, points_reward")
        .eq("code", achievementCode)
        .eq("is_active", true)
        .single();

      if (achievementError || !achievement) {
        throw new Error("Achievement not found");
      }

      const { data: existing } = await db
        .from<{ id: string }>("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id)
        .single();

      if (existing) return true;

      const { error: grantError } = await db.from("user_achievements").insert({
        user_id: userId,
        achievement_id: achievement.id,
        progress: 100,
        earned_at: new Date().toISOString(),
      });

      if (grantError) throw grantError;

      if (achievement.points_reward > 0) {
        await this.addPoints(
          userId,
          achievement.points_reward,
          "achievement",
          `Achievement: ${achievementCode}`,
          { achievement_code: achievementCode },
        );
      }

      return true;
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "grantAchievement",
        metadata: { userId, achievementCode },
      });
      return false;
    }
  }

  static async getLeaderboard(limit: number = PAGINATION.SMALL_LIMIT): Promise<LeaderboardRow[]> {
    try {
      const { data, error } = await db
        .from<LeaderboardRow>("user_levels")
        .select(`
          user_id,
          total_points,
          level,
          profiles:user_id(name, avatar_url)
        `)
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "getLeaderboard",
        metadata: { limit },
      });
      return [];
    }
  }

  static async getTopUsersByLocation(
    city: string,
    neighborhood: string | null = null,
    limit: number = PAGINATION.SMALL_LIMIT / 2,
  ): Promise<TopUserByLocation[]> {
    try {
      const { data, error } = await db.rpc<TopUsersByLocationRpcRow[]>("get_top_users_by_location", {
        p_city: city,
        p_neighborhood: neighborhood,
        p_limit: limit,
      });

      if (error) throw error;
      return normalizeTopUsersByLocation(data);
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "getTopUsersByLocation",
        metadata: { city, neighborhood, limit },
      });
      return [];
    }
  }

  static async getPointTransactions(
    userId: string,
    limit: number = PAGINATION.DEFAULT_LIMIT,
  ): Promise<PointTransaction[]> {
    try {
      const { data, error } = await db
        .from<PointTransaction>("point_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "getPointTransactions",
        metadata: { userId, limit },
      });
      return [];
    }
  }

  static calculateLevel(totalPoints: number): {
    level: number;
    pointsToNext: number;
    progress: number;
  } {
    const level = Math.floor(Math.sqrt(totalPoints / 100));
    const currentLevelPoints = level * level * 100;
    const nextLevelPoints = (level + 1) * (level + 1) * 100;
    const pointsToNext = nextLevelPoints - totalPoints;
    const progress =
      ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

    return {
      level: Math.max(1, level),
      pointsToNext: Math.max(0, pointsToNext),
      progress: Math.min(100, Math.max(0, progress)),
    };
  }

  static async getUserGamificationStats(userId: string): Promise<UserGamificationStats> {
    try {
      const [levelData, achievementsData, transactionsData] = await Promise.all([
        this.getUserLevel(userId),
        this.getUserAchievements(userId),
        this.getPointTransactions(userId, PAGINATION.SMALL_LIMIT / 2),
      ]);

      const level = levelData ?? {
        level: 1,
        total_points: 0,
        experience_points: 0,
        current_streak: 0,
        longest_streak: 0,
      };
      const levelInfo = this.calculateLevel(level.total_points);

      return {
        level: levelInfo.level,
        total_points: level.total_points,
        experience_points: level.experience_points || 0,
        achievements_count: achievementsData.filter((item) => item.earned_at).length,
        achievements_total: achievementsData.length,
        recent_transactions: transactionsData,
        level_progress: levelInfo.progress,
        points_to_next_level: levelInfo.pointsToNext,
        current_streak: level.current_streak || 0,
        longest_streak: level.longest_streak || 0,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "getUserGamificationStats",
        metadata: { userId },
      });
      return {
        level: 1,
        total_points: 0,
        experience_points: 0,
        achievements_count: 0,
        achievements_total: 0,
        recent_transactions: [],
        level_progress: 0,
        points_to_next_level: 100,
        current_streak: 0,
        longest_streak: 0,
      };
    }
  }

  static async processUserAction(
    userId: string,
    action: string,
    metadata: Record<string, unknown> = {},
  ): Promise<{ points: number; achievements: string[] }> {
    try {
      const result = { points: 0, achievements: [] as string[] };

      const actionPoints: Record<string, number> = {
        post_created: 10,
        comment_added: 5,
        helpful_vote: 2,
        review_written: 15,
        business_created: 50,
        profile_completed: 25,
        daily_login: 1,
        share_content: 3,
        like_given: 1,
      };
      const points = Object.entries(actionPoints).find(([key]) => key === action)?.[1] ?? 0;

      if (points > 0) {
        const success = await this.addPoints(userId, points, action, `Action: ${action}`, metadata);
        if (success) {
          result.points = points;
        }
      }

      return result;
    } catch (error) {
      trackError(error as Error, {
        component: "GamificationService",
        action: "processUserAction",
        metadata: { userId, action, metadata },
      });
      return { points: 0, achievements: [] };
    }
  }
}

export const gamificationService = new GamificationService();
