/**
 * 🏛️ ADMIN ALERTS SERVICE - SSOT v2.0 NÍVEL AAA
 *
 * Serviço administrativo para gerenciar alertas de segurança.
 * Delega para PostsFacade e ProfileService (SSOT).
 *
 * ✅ SSOT: Single Source of Truth - delega para serviços de domínio
 * ✅ Facade Pattern: Interface unificada para operações de admin
 * ✅ Type Safety: Conversão adequada entre tipos de domínio e admin
 * ✅ Error Tracking: Logging e tracking padronizados
 * ✅ Zero Gambiarras: Todos os acessos passam por serviços SSOT
 *
 * @version 2.0.0 - SSOT AAA Compliance
 */

import { PostsFacade } from "@/core/posts/services";
import { profileService } from "@/core/profiles/services";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

// ============================================================================
// 📦 TIPOS ESPECÍFICOS DE ADMIN PARA ALERTAS
// ============================================================================

export interface AdminAlertPost {
  id: string;
  texto: string;
  category: string;
  tipo_post: string;
  autor_id: string;
  created_at: string;
  expires_at: string | null;
  hidden: boolean;
  curtidas: number;
  comments_count: number;
  latitude: number | null;
  longitude: number | null;
  hashtags: string[] | null;
}

export interface AdminAlertProfile {
  id: string;
  name: string;
  neighborhood: string | null;
  alert_banned: boolean;
  pontos: number;
  created_at: string;
  avatar_url: string | null;
}

export interface AdminAlertStats {
  totalAlerts: number;
  activeAlerts: number;
  hiddenAlerts: number;
  bannedUsers: number;
}

export interface AdminAlertsListResult {
  data: AdminAlertPost[];
  profiles: AdminAlertProfile[];
  stats: AdminAlertStats;
  page: number;
  totalPages: number;
  total: number;
}

// ============================================================================
// 🏛️ ADMIN ALERTS SERVICE
// ============================================================================

class AdminAlertsService {
  /**
   * Busca todos os alertas de segurança
   * Delega para PostsFacade (SSOT) e ProfileService (SSOT)
   */
  async getAllAlerts(options?: {
    page?: number;
    limit?: number;
  }): Promise<AdminAlertsListResult> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 50;

      // ✅ SSOT AAA - Usa PostsFacade.getPostsByCategory para buscar alertas
      const allPosts = await PostsFacade.queries.getPostsByCategory({
        categories: ["alerta", "segurança"],
        tipoPost: ["alerta"],
        limit: 1000,
      });
      
      // ✅ SSOT AAA - Usa ProfileService para buscar perfis
      const allUsers = await profileService.getAllUsers();

      // Converte para tipo AdminAlertPost
      const adminAlerts: AdminAlertPost[] = allPosts.map((post) => ({
        id: post.id,
        texto: post.content || "",
        category: post.type || "", // Mapeia type para category
        tipo_post: post.type || "",
        autor_id: post.author_profile_id || "",
        created_at: post.created_at || "",
        expires_at: null, // Post não tem expires_at
        hidden: (post as any).hidden || false, // Campo adicionado via type assertion
        curtidas: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        latitude: null, // Post não tem latitude
        longitude: null, // Post não tem longitude
        hashtags: (post as any).tags || null, // Mapeia tags para hashtags
      }));

      // Converte para tipo AdminAlertProfile
      const adminProfiles: AdminAlertProfile[] = allUsers.map((user) => ({
        id: user.id,
        name: user.name,
        neighborhood: null, // getAllUsers não retorna neighborhood
        alert_banned: false, // Será buscado separadamente se necessário
        pontos: user.reputation || 0,
        created_at: "", // getAllUsers não retorna created_at
        avatar_url: user.avatar_url || null,
      }));

      // ✅ SSOT AAA - Busca alert_banned e neighborhood via ProfileService
      const authorIds = [...new Set(adminAlerts.map((p) => p.autor_id))];
      if (authorIds.length > 0) {
        const profilesWithAlertBan = await profileService.getProfilesWithAlertBan(authorIds);

        const profileMap = new Map<string, { alert_banned: boolean; neighborhood: string | null; created_at: string }>(
          profilesWithAlertBan.map((p) => [
            p.id,
            { alert_banned: p.alert_banned, neighborhood: p.neighborhood, created_at: p.created_at },
          ])
        );

        adminProfiles.forEach((profile) => {
          const extraData = profileMap.get(profile.id);
          if (extraData) {
            profile.alert_banned = extraData.alert_banned;
            profile.neighborhood = extraData.neighborhood;
            profile.created_at = extraData.created_at;
          }
        });
      }

      // Calcula estatísticas
      const stats: AdminAlertStats = {
        totalAlerts: adminAlerts.length,
        activeAlerts: adminAlerts.filter((a) => !a.hidden).length,
        hiddenAlerts: adminAlerts.filter((a) => a.hidden).length,
        bannedUsers: adminProfiles.filter((p) => p.alert_banned).length,
      };

      // Paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = adminAlerts.slice(startIndex, endIndex);
      const totalPages = Math.ceil(adminAlerts.length / limit);

      return {
        data: paginatedData,
        profiles: adminProfiles,
        stats,
        page,
        totalPages,
        total: adminAlerts.length,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAlertsService",
        action: "getAllAlerts",
      });
      logger.error("Erro ao buscar alertas", error);
      throw error;
    }
  }

  /**
   * Alterna o status de visibilidade de um alerta
   * Delega para PostsFacade (SSOT AAA)
   */
  async toggleAlertVisibility(alertId: string, hidden: boolean): Promise<void> {
    try {
      // ✅ SSOT AAA - Usa PostsFacade.updatePost com campo hidden
      await PostsFacade.mutations.updatePost(alertId, { hidden });
      logger.info(`Alerta ${alertId} ${hidden ? "ocultado" : "reexibido"}`);
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAlertsService",
        action: "toggleAlertVisibility",
      });
      logger.error("Erro ao alternar visibilidade do alerta", error);
      throw error;
    }
  }

  /**
   * Exclui um alerta
   * Delega para PostsFacade (SSOT)
   */
  async deleteAlert(alertId: string): Promise<void> {
    try {
      // ✅ SSOT - Usa PostsFacade para deletar post
      await PostsFacade.mutations.deletePost(alertId);
      logger.info(`Alerta ${alertId} excluído`);
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAlertsService",
        action: "deleteAlert",
      });
      logger.error("Erro ao excluir alerta", error);
      throw error;
    }
  }

  /**
   * Alterna o status de ban de alertas de um perfil
   * Delega para ProfileService (SSOT AAA)
   */
  async toggleAlertBan(profileId: string, banned: boolean): Promise<void> {
    try {
      // ✅ SSOT AAA - Usa ProfileService.updateAlertBanStatus
      await profileService.updateAlertBanStatus(profileId, banned);
      logger.info(`Perfil ${profileId} ${banned ? "banido" : "desbanido"} de alertas`);
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAlertsService",
        action: "toggleAlertBan",
      });
      logger.error("Erro ao alternar ban de alertas", error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de alertas
   */
  async getStats(): Promise<AdminAlertStats> {
    try {
      const result = await this.getAllAlerts({ limit: 1000 });
      return result.stats;
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAlertsService",
        action: "getStats",
      });
      logger.error("Erro ao buscar estatísticas de alertas", error);
      throw error;
    }
  }
}

// ============================================================================
// 📤 EXPORTAÇÃO SINGLETON
// ============================================================================

export const adminAlertsService = new AdminAlertsService();
