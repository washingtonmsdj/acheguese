/**
 * MetricsService - SSOT para métricas e estatísticas
 * 
 * Encapsula acesso ao Supabase para operações de métricas em tempo real.
 * Modules devem usar este service ao invés de acessar integrations diretamente.
 * 
 * @version 1.0.0
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { profileService } from "@/core/profiles/services/ProfileService";
import { postService } from "@/core/posts/services/PostService";
import { BusinessService } from "@/core/business/services/BusinessService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";

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
  /**
   * Buscar métricas em tempo real
   * ✅ SSOT: Delega para os serviços apropriados
   */
  static async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const [users, sessions, rides, posts, businesses] = await Promise.all([
        // ✅ Delega para ProfileService
        profileService.getTotalProfilesCount(),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('rides').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        // ✅ Delega para PostService
        postService.getTotalPostsCount(),
        // ✅ Delega para BusinessService
        BusinessService.getTotalBusinessesCount()
      ]);

      return {
        activeUsers: users || 0,
        activeSessions: sessions.count || 0,
        activeRides: rides.count || 0,
        totalPosts: posts || 0,
        totalBusinesses: businesses || 0
      };
    } catch (error: any) {
      logger.error('Error fetching realtime metrics:', error);
      return {
        activeUsers: 0,
        activeSessions: 0,
        activeRides: 0,
        totalPosts: 0,
        totalBusinesses: 0
      };
    }
  }

  /**
   * Subscrever a métricas em tempo real
   */
  static subscribeToMetrics(
    callback: (metrics: Partial<RealtimeMetrics>) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel('realtime-metrics')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => callback({ activeUsers: undefined })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        () => callback({ activeRides: undefined })
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => callback({ totalPosts: undefined })
      )
      .subscribe();

    return channel;
  }

  /**
   * Cancelar subscrição de métricas
   */
  static unsubscribeFromMetrics(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  }

  /**
   * Buscar estatísticas de reputação de um usuário
   * ✅ SSOT: Delega para ProfileService e ReviewsService
   */
  static async getReputationStats(userId: string): Promise<ReputationStats | null> {
    try {
      // ✅ Delega para ProfileService
      const profile = await profileService.getProfileByUserId(userId);
      if (!profile) return null;

      // ✅ Delega para ReviewsService
      const reviews = await ReviewsService.getReviewsForProfile(profile.id, 'business');

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Buscar badges (simplificado)
      const badges: string[] = [];
      if (profile.reputation >= 100) badges.push('bronze');
      if (profile.reputation >= 500) badges.push('silver');
      if (profile.reputation >= 1000) badges.push('gold');

      return {
        userId,
        reputation: profile.reputation || 0,
        totalReviews,
        averageRating,
        badges
      };
    } catch (error: any) {
      logger.error('Error fetching reputation stats:', error);
      return null;
    }
  }

  /**
   * Incrementar métrica específica
   */
  static async incrementMetric(metric: string, value = 1) {
    try {
      await supabase.rpc('increment_metric', { 
        metric_name: metric, 
        increment_value: value 
      });
    } catch (error: any) {
      logger.error(`Error incrementing metric ${metric}:`, error);
    }
  }

  /**
   * Buscar histórico de métricas
   */
  static async getMetricsHistory(
    metricName: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const { data, error } = await supabase
        .from('metrics_history')
        .select('*')
        .eq('metric_name', metricName)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      logger.error('Error fetching metrics history:', error);
      return [];
    }
  }
}
