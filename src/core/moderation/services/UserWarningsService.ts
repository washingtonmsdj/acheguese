// @ts-nocheck
/**
 * 🔒 USER WARNINGS SERVICE - SSOT v2.0
 *
 * Serviço de domínio para gerenciar warnings de usuários.
 * Single Source of Truth para operações de warnings.
 *
 * @version 2.0.0 - SSOT AAA Compliance
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

// ============================================================================
// 📦 TIPOS
// ============================================================================

export interface UserWarning {
  id: string;
  user_id: string;
  admin_id: string;
  tipo: "advertencia" | "suspensao_7d" | "suspensao_permanente";
  motivo: string;
  created_at: string;
}

export interface CreateUserWarningData {
  user_id: string;
  admin_id: string;
  tipo: "advertencia" | "suspensao_7d" | "suspensao_permanente";
  motivo: string;
}

// ============================================================================
// 🔒 USER WARNINGS SERVICE
// ============================================================================

class UserWarningsService {
  private readonly TABLE = "user_warnings";

  /**
   * Busca todos os warnings
   */
  async getAllWarnings(limit = 1000): Promise<UserWarning[]> {
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
        component: "UserWarningsService",
        action: "getAllWarnings",
      });
      logger.error("Erro ao buscar warnings", error);
      return [];
    }
  }

  /**
   * Busca warnings de um usuário
   */
  async getUserWarnings(userId: string): Promise<UserWarning[]> {
    try {
      const { data, error } = await (supabase as any)
        .from(this.TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "getUserWarnings",
        metadata: { userId },
      });
      logger.error("Erro ao buscar warnings do usuário", error);
      return [];
    }
  }

  /**
   * Cria um novo warning
   */
  async createWarning(data: CreateUserWarningData): Promise<UserWarning> {
    try {
      const { data: warning, error } = await (supabase as any)
        .from(this.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      logger.info(`Warning criado para usuário ${data.user_id} por admin ${data.admin_id}`);
      return warning;
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "createWarning",
        metadata: { data },
      });
      logger.error("Erro ao criar warning", error);
      throw error;
    }
  }

  /**
   * Conta warnings de um usuário
   */
  async getUserWarningCount(userId: string): Promise<number> {
    try {
      const { count, error } = await (supabase as any)
        .from(this.TABLE)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      trackError(error as Error, {
        component: "UserWarningsService",
        action: "getUserWarningCount",
        metadata: { userId },
      });
      logger.error("Erro ao contar warnings do usuário", error);
      return 0;
    }
  }
}

// ============================================================================
// 📤 EXPORTAÇÃO SINGLETON
// ============================================================================

export const userWarningsService = new UserWarningsService();
