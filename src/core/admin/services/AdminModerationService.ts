/**
 * 🏛️ ADMIN MODERATION SERVICE - SSOT v2.0 NÍVEL AAA
 *
 * Serviço administrativo para moderação de conteúdo.
 * Delega para PostsFacade, CommentsFacade, ProfileService (SSOT).
 *
 * ✅ SSOT: Single Source of Truth - delega para serviços de domínio
 * ✅ Facade Pattern: Interface unificada para operações de moderação
 * ✅ Type Safety: Conversão adequada entre tipos de domínio e admin
 * ✅ Error Tracking: Logging e tracking padronizados
 * ✅ Zero Gambiarras: Todos os acessos passam por serviços SSOT
 *
 * @version 2.0.0 - SSOT AAA Compliance
 */

import { PostsFacade } from "@/core/posts/services";
import { CommentsFacade } from "@/core/comments/services";
import { profileService } from "@/core/profiles/services";
import { userWarningsService, adminAuditService } from "@/core/moderation";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

// ============================================================================
// 📦 TIPOS ESPECÍFICOS DE ADMIN PARA MODERAÇÃO
// ============================================================================

export interface AdminModerationContent {
  id: string;
  type: "post" | "comment";
  author_profile_id: string;
  content: string;
  created_at: string;
  status: string;
}

export interface AdminWarning {
  id: string;
  user_id: string;
  admin_id: string;
  tipo: "advertencia" | "suspensao_7d" | "suspensao_permanente";
  motivo: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface AdminModerationData {
  posts: any[];
  comments: any[];
  profiles: any[];
  warnings: AdminWarning[];
  auditLogs: AdminAuditLog[];
}

// ============================================================================
// 🏛️ ADMIN MODERATION SERVICE
// ============================================================================

class AdminModerationService {
  /**
   * Busca todos os dados de moderação
   * Delega para PostsFacade, CommentsFacade, ProfileService (SSOT)
   */
  async getAllModerationData(): Promise<AdminModerationData> {
    try {
      // ✅ SSOT AAA - Usa PostsFacade para buscar posts
      const feedResult = await PostsFacade.queries.getFeed({
        limit: 1000,
      });
      const posts = feedResult.posts;

      // ✅ SSOT AAA - Usa CommentsFacade para buscar comentários
      const comments = await CommentsFacade.queries.getAllComments(1000);

      // ✅ SSOT AAA - Usa ProfileService para buscar perfis
      const profiles = await profileService.getAllUsers();

      // ✅ SSOT AAA - Usa UserWarningsService para buscar warnings
      const warnings = await userWarningsService.getAllWarnings();

      // ✅ SSOT AAA - Usa AdminAuditService para buscar audit logs
      const auditLogs = await adminAuditService.getAllAuditLogs();

      return {
        posts,
        comments,
        profiles,
        warnings,
        auditLogs,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "AdminModerationService",
        action: "getAllModerationData",
      });
      logger.error("Erro ao buscar dados de moderação", error);
      throw error;
    }
  }

  /**
   * Exclui conteúdo (post ou comentário)
   * Delega para PostsFacade ou CommentsFacade (SSOT)
   */
  async deleteContent(
    type: "post" | "comment",
    contentId: string,
  ): Promise<void> {
    try {
      if (type === "post") {
        // ✅ SSOT AAA - Usa PostsFacade para deletar post
        await PostsFacade.mutations.deletePost(contentId);
        logger.info(`Post ${contentId} excluído via moderação`);
      } else {
        // ✅ SSOT AAA - Usa CommentsFacade para deletar comentário
        await CommentsFacade.mutations.deleteComment(contentId);
        logger.info(`Comentário ${contentId} excluído via moderação`);
      }
    } catch (error) {
      trackError(error as Error, {
        component: "AdminModerationService",
        action: "deleteContent",
      });
      logger.error("Erro ao excluir conteúdo", error);
      throw error;
    }
  }

  /**
   * Aplica warning/suspensão a um usuário
   * Delega para ProfileService (SSOT) e usa supabase para tabelas específicas
   */
  async warnUser(
    userId: string,
    warnType: "advertencia" | "suspensao_7d" | "suspensao_permanente",
    motivo: string,
    adminId: string,
  ): Promise<void> {
    try {
      // ✅ SSOT AAA - Usa UserWarningsService para criar warning
      await userWarningsService.createWarning({
        user_id: userId,
        admin_id: adminId,
        tipo: warnType,
        motivo,
      });

      // ✅ SSOT AAA - Usa ProfileService para atualizar perfil
      const profile = await profileService.getProfileById(userId);
      const currentWarningCount = (profile as any)?.warning_count ?? 0;
      const newWarningCount = currentWarningCount + 1;

      const updateData: any = { warning_count: newWarningCount };

      if (warnType === "suspensao_7d") {
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + 7);
        updateData.suspended = true;
        updateData.suspended_until = suspendedUntil.toISOString();
      } else if (warnType === "suspensao_permanente") {
        updateData.suspended = true;
        updateData.suspended_until = null;
      }

      await profileService.updateProfile(userId, updateData);

      // ✅ SSOT AAA - Usa AdminAuditService para criar audit log
      await adminAuditService.createAuditLog({
        admin_id: adminId,
        action_type: warnType,
        target_type: "profile",
        target_id: userId,
        details: motivo,
      });

      logger.info(
        `Warning ${warnType} aplicado ao usuário ${userId} por admin ${adminId}`,
      );
    } catch (error) {
      trackError(error as Error, {
        component: "AdminModerationService",
        action: "warnUser",
      });
      logger.error("Erro ao aplicar warning", error);
      throw error;
    }
  }

  /**
   * Busca warnings de um usuário
   */
  async getUserWarnings(userId: string): Promise<AdminWarning[]> {
    try {
      // ✅ SSOT AAA - Usa UserWarningsService
      return await userWarningsService.getUserWarnings(userId);
    } catch (error) {
      trackError(error as Error, {
        component: "AdminModerationService",
        action: "getUserWarnings",
      });
      logger.error("Erro ao buscar warnings", error);
      throw error;
    }
  }

  /**
   * Busca audit logs
   */
  async getAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    try {
      // ✅ SSOT AAA - Usa AdminAuditService
      return await adminAuditService.getAllAuditLogs(limit);
    } catch (error) {
      trackError(error as Error, {
        component: "AdminModerationService",
        action: "getAuditLogs",
      });
      logger.error("Erro ao buscar audit logs", error);
      throw error;
    }
  }
}

// ============================================================================
// 📤 EXPORTAÇÃO SINGLETON
// ============================================================================

export const adminModerationService = new AdminModerationService();

