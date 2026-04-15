// @ts-nocheck
/**
 * 🏆 ADMIN STATS SERVICE - SSOT para Estatísticas Administrativas
 *
 * ✅ Fonte única para TODAS as estatísticas do dashboard admin
 * ✅ Delega para serviços específicos (SSOT compliance)
 * ✅ Tratamento de erros padronizado
 * ✅ Logging consistente
 * ✅ ZERO queries diretas ao Supabase
 *
 * @version 2.0.1 - Export Fix
 */

import { logger } from "@/shared/utils/logger";
import { BusinessService } from "@/core/business/services/BusinessService";
import {
  getTotalClassifiedsCount,
  getClassifiedsCreatedInPeriod,
  getRecentClassifieds,
} from "@/modules/classifieds/services";
import { getMobilityStats } from "@/core/mobility/services";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { postService } from "@/core/posts/services/PostService";
import { eventService } from "@/core/events/services/EventsService";
import { commentService } from "@/core/comments/services/CommentService";

// ============================================================================
// TYPES
// ============================================================================

export interface PremiumStats {
  total: number;
  percentage: number;
}

export interface TableStats {
  [tableName: string]: number;
  businesses?: number;
  professionals?: number;
  classifieds?: number;
  events?: number;
  posts?: number;
  profiles?: number;
  comments?: number;
  drivers?: number;
  ride_requests?: number;
}

export interface ActivityData {
  date: string;
  posts: number;
  users: number;
  businesses: number;
  eventos: number;
  classificados: number;
}

export interface RecentActivity {
  type: string;
  label: string;
  date: string;
}

// ============================================================================
// SERVICE
// ============================================================================

/**
 * SSOT para estatísticas do dashboard admin
 * ✅ Consolidação completa - Todas as queries delegadas para serviços específicos
 */
class AdminStatsService {
  // ============================================================================
  // 👑 ESTATÍSTICAS DE EMPRESAS PREMIUM
  // ============================================================================

  /**
   * 👑 BUSCAR ESTATÍSTICAS DE EMPRESAS PREMIUM
   * ✅ SSOT: Delega para BusinessService
   *
   * @param totalBusinesses - Total de empresas para calcular percentual
   * @returns Estatísticas de empresas premium
   */
  async getPremiumBusinessStats(
    totalBusinesses: number,
  ): Promise<PremiumStats> {
    try {
      // ✅ SSOT: Usar BusinessService.getPremiumBusinessesCount()
      const premiumCount = await BusinessService.getPremiumBusinessesCount();

      return {
        total: premiumCount,
        percentage:
          totalBusinesses > 0
            ? Math.round((premiumCount / totalBusinesses) * 100)
            : 0,
      };
    } catch (error) {
      logger.error("Error fetching premium business stats", error as Error, {
        service: "AdminStatsService",
        method: "getPremiumBusinessStats",
      });
      throw error;
    }
  }

  // ============================================================================
  // 📊 CONTAGEM DE REGISTROS POR TABELA
  // ============================================================================

  /**
   * 📊 OBTER ESTATÍSTICAS DE CONTAGEM DE REGISTROS
   * ✅ SSOT: Delega para serviços específicos de cada domínio
   *
   * @returns Objeto com contagens de todas as tabelas
   */
  async getTableStats(): Promise<TableStats> {
    try {
      // ✅ SSOT: Buscar de cada serviço específico em paralelo
      const [
        businessesCount,
        professionalsCount,
        classifiedsCount,
        eventsCount,
        postsCount,
        profilesCount,
        commentsCount,
        mobilityStats,
      ] = await Promise.all([
        BusinessService.getTotalBusinessesCount(),
        ProfessionalService.getTotalProfessionalsCount(),
        getTotalClassifiedsCount(),
        eventService.getTotalEventsCount(),
        postService.getTotalPostsCount(),
        profileService.getTotalProfilesCount(),
        commentService.getTotalCommentsCount(),
        getMobilityStats(),
      ]);

      const stats: TableStats = {
        businesses: businessesCount,
        professionals: professionalsCount,
        classifieds: classifiedsCount,
        events: eventsCount,
        posts: postsCount,
        profiles: profilesCount,
        comments: commentsCount,
        drivers: mobilityStats.total_drivers,
        ride_requests: mobilityStats.total_rides,
      };

      return stats;
    } catch (error) {
      logger.error("Failed to get table stats", error as Error, {
        service: "AdminStatsService",
        method: "getTableStats",
      });
      throw error;
    }
  }

  /**
   * 📈 OBTER ESTATÍSTICAS COM TENDÊNCIAS
   * ✅ SSOT: Calcula tendências comparando com período anterior
   *
   * @param currentPeriodDays - Dias do período atual (padrão: 7)
   * @returns Estatísticas com indicadores de tendência
   */
  async getTableStatsWithTrends(currentPeriodDays: number = 7): Promise<{
    stats: TableStats;
    trends: Record<string, { value: number; direction: "up" | "down" | "neutral" }>;
  }> {
    try {
      // Buscar contagens atuais
      const currentStats = await this.getTableStats();

      // Calcular datas
      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - currentPeriodDays);

      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - currentPeriodDays);

      // Buscar contagens do período anterior em paralelo
      const [
        prevBusinesses,
        prevProfessionals,
        prevClassifieds,
        prevEvents,
        prevPosts,
        prevProfiles,
      ] = await Promise.all([
        BusinessService.getBusinessesCreatedInPeriod(previousStart, currentStart),
        ProfessionalService.getProfessionalsCreatedInPeriod(previousStart, currentStart),
        getClassifiedsCreatedInPeriod(previousStart, currentStart),
        eventService.getEventsCreatedInPeriod(previousStart, currentStart),
        postService.getPostsCreatedInPeriod(previousStart, currentStart),
        profileService.getProfilesCreatedInPeriod(previousStart, currentStart),
      ]);

      // Buscar contagens do período atual
      const [
        currBusinesses,
        currProfessionals,
        currClassifieds,
        currEvents,
        currPosts,
        currProfiles,
      ] = await Promise.all([
        BusinessService.getBusinessesCreatedInPeriod(currentStart, now),
        ProfessionalService.getProfessionalsCreatedInPeriod(currentStart, now),
        getClassifiedsCreatedInPeriod(currentStart, now),
        eventService.getEventsCreatedInPeriod(currentStart, now),
        postService.getPostsCreatedInPeriod(currentStart, now),
        profileService.getProfilesCreatedInPeriod(currentStart, now),
      ]);

      // Calcular tendências
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) {
          return { value: current > 0 ? 100 : 0, direction: current > 0 ? "up" as const : "neutral" as const };
        }
        const change = ((current - previous) / previous) * 100;
        return {
          value: Math.round(Math.abs(change)),
          direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "neutral" as const,
        };
      };

      const trends = {
        businesses: calculateTrend(currBusinesses, prevBusinesses),
        professionals: calculateTrend(currProfessionals, prevProfessionals),
        classifieds: calculateTrend(currClassifieds, prevClassifieds),
        events: calculateTrend(currEvents, prevEvents),
        posts: calculateTrend(currPosts, prevPosts),
        profiles: calculateTrend(currProfiles, prevProfiles),
      };

      return { stats: currentStats, trends };
    } catch (error) {
      logger.error("Failed to get stats with trends", error as Error, {
        service: "AdminStatsService",
        method: "getTableStatsWithTrends",
      });
      // Retornar stats sem trends em caso de erro
      const stats = await this.getTableStats();
      return { stats, trends: {} };
    }
  }

  // ============================================================================
  // 📈 DADOS DE ATIVIDADE POR DIA
  // ============================================================================

  /**
   * 📈 OBTER DADOS DE ATIVIDADE POR DIA
   * Gera dados agregados por período — uma única passagem, sem query por dia.
   */
  async getActivity(days = 30): Promise<ActivityData[]> {
    try {
      const [posts, profiles, businesses, events, classifieds] = await Promise.all([
        postService.getRecentPosts(200),
        profileService.getRecentProfiles(200),
        BusinessService.getRecentBusinessesLegacy(200),
        eventService.getRecentEvents(200),
        getRecentClassifieds(200),
      ]);

      // Monta um mapa date → contagens
      const map = new Map<string, ActivityData>();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Inicializa todos os dias com zero
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().split("T")[0];
        map.set(key, { date: key, posts: 0, users: 0, businesses: 0, eventos: 0, classificados: 0 });
      }

      const dateKey = (iso: string) => iso?.split("T")[0] ?? "";

      posts.forEach((p) => { const e = map.get(dateKey(p.created_at)); if (e) e.posts++; });
      profiles.forEach((p) => { const e = map.get(dateKey(p.created_at)); if (e) e.users++; });
      businesses.forEach((b) => { const e = map.get(dateKey(b.created_at)); if (e) e.businesses++; });
      events.forEach((ev) => { const e = map.get(dateKey(ev.created_at)); if (e) e.eventos++; });
      classifieds.forEach((c) => { const e = map.get(dateKey(c.created_at)); if (e) e.classificados++; });

      return Array.from(map.values());
    } catch (error) {
      logger.error("Failed to get activity data", error as Error, {
        service: "AdminStatsService",
        method: "getActivity",
      });
      return [];
    }
  }

  // ============================================================================
  // 🕐 ATIVIDADES RECENTES
  // ============================================================================

  /**
   * 🕐 OBTER ATIVIDADES RECENTES DO SISTEMA
   * ✅ SSOT: Busca de cada serviço específico e agrega
   *
   * @param limit - Número máximo de atividades (padrão: 10)
   * @returns Array com atividades recentes ordenadas por data
   */
  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    try {
      const recent: RecentActivity[] = [];

      // ✅ SSOT: Buscar de cada serviço específico em paralelo
      const [businesses, posts, events, classifieds, profiles, comments] =
        await Promise.all([
          BusinessService.getRecentBusinessesLegacy(5),
          postService.getRecentPosts(5),
          eventService.getRecentEvents(5),
          getRecentClassifieds(5),
          profileService.getRecentProfiles(5),
          commentService.getRecentComments(5),
        ]);

      // Adicionar businesses
      businesses.forEach((b) => {
        recent.push({
          type: "business",
          label: `Nova empresa: ${b.name || "Sem nome"}`,
          date: b.created_at,
        });
      });

      // Adicionar posts
      posts.forEach((p) => {
        const content = p.content || p.texto || "";
        const preview =
          content.length > 50 ? content.substring(0, 50) + "..." : content;
        recent.push({
          type: "post",
          label: `Novo post: ${preview || "Sem conteúdo"}`,
          date: p.created_at,
        });
      });

      // Adicionar eventos
      events.forEach((e) => {
        recent.push({
          type: "event",
          label: `Novo evento: ${e.title || "Sem título"}`,
          date: e.created_at,
        });
      });

      // Adicionar classificados
      classifieds.forEach((c) => {
        recent.push({
          type: "classified",
          label: `Novo classificado: ${c.title || "Sem título"}`,
          date: c.created_at,
        });
      });

      // Adicionar usuários
      profiles.forEach((p) => {
        recent.push({
          type: "user",
          label: `Novo usuário: ${p.name || p.username || "Sem nome"}`,
          date: p.created_at,
        });
      });

      // Adicionar comentários
      comments.forEach((c: any) => {
        const content = c.content || c.texto || "";
        const preview =
          content.length > 40 ? content.substring(0, 40) + "..." : content;
        recent.push({
          type: "comment",
          label: `Novo comentário: ${preview || "Sem conteúdo"}`,
          date: c.created_at,
        });
      });

      // Ordenar por data (mais recente primeiro) e limitar
      return recent
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error("Failed to get recent activity", error as Error, {
        service: "AdminStatsService",
        method: "getRecentActivity",
      });
      return [];
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const adminStatsService = new AdminStatsService();
