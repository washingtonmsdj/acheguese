/**
 * Metrics service.
 *
 * Centralizes metric reads and realtime subscriptions.
 */

import { BusinessService } from "@/core/business/services/BusinessService";
import { postService } from "@/core/posts/services/PostService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { supabase } from "@/integrations/supabase";
import type { RealtimeChannel } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryResult<TRow[]>> {
  select: (
    columns: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  gte: (column: string, value: string | number) => QueryBuilder<TRow>;
  lte: (column: string, value: string | number) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
}

interface MetricsRpcClient {
  rpc: <TResult = unknown>(
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<QueryResult<TResult>>;
}

interface MetricsDbClient extends MetricsRpcClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

interface MetricsHistoryRow {
  id: string;
  metric_name: string;
  value: number | null;
  created_at: string;
}

const metricsDb = supabase as unknown as MetricsDbClient;

export interface RealtimeMetrics {
  activeUsers: number;
  activeSessions: number;
  activeRides: number;
  totalPosts: number;
  totalBusinesses: number;
}

export interface ReputationStats {
  userId: string;
  reputation: number;
  totalReviews: number;
  averageRating: number;
  badges: string[];
}

export class MetricsService {
  static async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const [users, sessions, rides, posts, businesses] = await Promise.all([
        profileService.getTotalProfilesCount(),
        metricsDb
          .from("user_sessions")
          .select("id", { count: "exact", head: true })
          .eq("active", true),
        metricsDb
          .from("rides")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        postService.getTotalPostsCount(),
        BusinessService.getTotalBusinessesCount(),
      ]);

      return {
        activeUsers: users || 0,
        activeSessions: sessions.count || 0,
        activeRides: rides.count || 0,
        totalPosts: posts || 0,
        totalBusinesses: businesses || 0,
      };
    } catch (error: unknown) {
      logger.error("Error fetching realtime metrics:", toError(error));
      return {
        activeUsers: 0,
        activeSessions: 0,
        activeRides: 0,
        totalPosts: 0,
        totalBusinesses: 0,
      };
    }
  }

  static subscribeToMetrics(
    callback: (metrics: Partial<RealtimeMetrics>) => void,
  ): RealtimeChannel {
    const channel = supabase
      .channel("realtime-metrics")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => callback({ activeUsers: undefined }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        () => callback({ activeRides: undefined }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => callback({ totalPosts: undefined }),
      )
      .subscribe();

    return channel;
  }

  static unsubscribeFromMetrics(channel: RealtimeChannel): void {
    supabase.removeChannel(channel);
  }

  static async getReputationStats(userId: string): Promise<ReputationStats | null> {
    try {
      const profiles = await profileService.getProfilesByUserId(userId);
      const profile = profiles?.[0];
      if (!profile) return null;

      const reviews = await ReviewsService.getReviewsForProfile(profile.id, "business");
      const totalReviews = reviews?.length || 0;
      const averageRating =
        totalReviews > 0
          ? reviews!.reduce((sum, review) => sum + review.rating, 0) / totalReviews
          : 0;

      const badges: string[] = [];
      if (profile.reputation >= 100) badges.push("bronze");
      if (profile.reputation >= 500) badges.push("silver");
      if (profile.reputation >= 1000) badges.push("gold");

      return {
        userId,
        reputation: profile.reputation || 0,
        totalReviews,
        averageRating,
        badges,
      };
    } catch (error: unknown) {
      logger.error("Error fetching reputation stats:", toError(error));
      return null;
    }
  }

  static async incrementMetric(metric: string, value = 1): Promise<void> {
    try {
      await metricsDb.rpc("increment_metric", {
        metric_name: metric,
        increment_value: value,
      });
    } catch (error: unknown) {
      logger.error(`Error incrementing metric ${metric}:`, toError(error));
    }
  }

  static async getMetricsHistory(
    metricName: string,
    startDate: string,
    endDate: string,
  ): Promise<MetricsHistoryRow[]> {
    try {
      const { data, error } = await metricsDb
        .from<MetricsHistoryRow>("metrics_history")
        .select("*")
        .eq("metric_name", metricName)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      logger.error("Error fetching metrics history:", toError(error));
      return [];
    }
  }
}
