/**
 * 🔒 ADMIN AUDIT SERVICE - SSOT v2.0
 *
 * Serviço de domínio para gerenciar logs de auditoria de admin.
 * Single Source of Truth para operações de audit logs.
 *
 * @version 2.0.0 - SSOT AAA Compliance
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

// ============================================================================
// 📦 TIPOS
// ============================================================================

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface CreateAdminAuditLogData {
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
}

// ============================================================================
// 🔒 ADMIN AUDIT SERVICE
// ============================================================================

class AdminAuditService {
  private readonly TABLE = "admin_audit_logs";

  /**
   * Busca todos os audit logs
   */
  async getAllAuditLogs(limit = 100): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAuditService",
        action: "getAllAuditLogs",
      });
      logger.error("Erro ao buscar audit logs", error);
      return [];
    }
  }

  /**
   * Busca audit logs de um admin
   */
  async getAdminAuditLogs(adminId: string, limit = 100): Promise<AdminAuditLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.TABLE)
        .select("*")
        .eq("admin_id", adminId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAuditService",
        action: "getAdminAuditLogs",
        metadata: { adminId },
      });
      logger.error("Erro ao buscar audit logs do admin", error);
      return [];
    }
  }

  /**
   * Cria um novo audit log
   */
  async createAuditLog(data: CreateAdminAuditLogData): Promise<AdminAuditLog> {
    try {
      const { data: auditLog, error } = await (supabase as any)
        .from(this.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      logger.info(`Audit log criado por admin ${data.admin_id}: ${data.action_type}`);
      return auditLog;
    } catch (error) {
      trackError(error as Error, {
        component: "AdminAuditService",
        action: "createAuditLog",
        metadata: { data },
      });
      logger.error("Erro ao criar audit log", error);
      throw error;
    }
  }
}

// ============================================================================
// 📤 EXPORTAÇÃO SINGLETON
// ============================================================================

export const adminAuditService = new AdminAuditService();
