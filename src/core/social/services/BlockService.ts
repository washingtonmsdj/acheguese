/**
 * BlockService - SSOT para Bloqueios de Usuários
 *
 * ✅ Fonte única de verdade para gerenciamento de bloqueios
 * ✅ Todas as operações de bloqueio passam por aqui
 * ✅ Sem queries diretas ao Supabase fora deste service
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";

export interface BlockedUser {
  id: string;
  blocker_user_id: string;
  blocked_user_id: string;
  blocked_profile?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  reason?: string;
  created_at: string;
}

export interface BlockStats {
  total_blocked: number;
  blocked_by_me: number;
  blocked_me: number;
}

class BlockService {
  private readonly TABLE = "user_blocks";
  private readonly db = supabase as any;

  /**
   * ✅ SSOT: Obter lista de usuários bloqueados
   */
  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      const { data, error } = await this.db
        .from(this.TABLE)
        .select(
          `
          *,
          blocked_profile:profiles!user_blocks_blocked_user_id_fkey(
            id,
            name,
            username,
            avatar_url
          )
        `,
        )
        .eq("blocker_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as BlockedUser[]) || [];
    } catch (error) {
      logger.error("Error fetching blocked users", error as Error, {
        service: "BlockService",
        method: "getBlockedUsers",
        userId,
      });
      throw error;
    }
  }

  /**
   * ✅ SSOT: Bloquear usuário
   */
  async blockUser(
    blockerUserId: string,
    blockedUserId: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      // Verificar se já está bloqueado
      const { data: existing } = await this.db
        .from(this.TABLE)
        .select("id")
        .eq("blocker_user_id", blockerUserId)
        .eq("blocked_user_id", blockedUserId)
        .single();

      if (existing) {
        return true; // Já bloqueado
      }

      // Criar bloqueio
      const { error } = await this.db.from(this.TABLE).insert({
        blocker_user_id: blockerUserId,
        blocked_user_id: blockedUserId,
        reason,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error("Error blocking user", error as Error, {
        service: "BlockService",
        method: "blockUser",
        blockerUserId,
        blockedUserId,
      });
      throw error;
    }
  }

  /**
   * ✅ SSOT: Desbloquear usuário
   */
  async unblockUser(
    blockerUserId: string,
    blockedUserId: string,
  ): Promise<boolean> {
    try {
      const { error } = await this.db
        .from(this.TABLE)
        .delete()
        .eq("blocker_user_id", blockerUserId)
        .eq("blocked_user_id", blockedUserId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error("Error unblocking user", error as Error, {
        service: "BlockService",
        method: "unblockUser",
        blockerUserId,
        blockedUserId,
      });
      throw error;
    }
  }

  /**
   * ✅ SSOT: Verificar se usuário está bloqueado
   */
  async isBlocked(
    blockerUserId: string,
    blockedUserId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.db
        .from(this.TABLE)
        .select("id")
        .eq("blocker_user_id", blockerUserId)
        .eq("blocked_user_id", blockedUserId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return !!data;
    } catch (error) {
      logger.error("Error checking if user is blocked", error as Error, {
        service: "BlockService",
        method: "isBlocked",
        blockerUserId,
        blockedUserId,
      });
      return false;
    }
  }

  /**
   * ✅ SSOT: Verificar bloqueio mútuo (A bloqueou B ou B bloqueou A)
   */
  async isMutuallyBlocked(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await this.db
        .from(this.TABLE)
        .select("id")
        .or(
          `and(blocker_user_id.eq.${userId1},blocked_user_id.eq.${userId2}),and(blocker_user_id.eq.${userId2},blocked_user_id.eq.${userId1})`,
        )
        .limit(1);

      if (error) throw error;

      return data && data.length > 0;
    } catch (error) {
      logger.error("Error checking mutual block", error as Error, {
        service: "BlockService",
        method: "isMutuallyBlocked",
        userId1,
        userId2,
      });
      return false;
    }
  }

  /**
   * ✅ SSOT: Obter estatísticas de bloqueios
   */
  async getBlockStats(userId: string): Promise<BlockStats> {
    try {
      const [blockedByMe, blockedMe] = await Promise.all([
        this.db
          .from(this.TABLE)
          .select("id", { count: "exact", head: true })
          .eq("blocker_user_id", userId),
        this.db
          .from(this.TABLE)
          .select("id", { count: "exact", head: true })
          .eq("blocked_user_id", userId),
      ]);

      return {
        total_blocked: (blockedByMe.count || 0) + (blockedMe.count || 0),
        blocked_by_me: blockedByMe.count || 0,
        blocked_me: blockedMe.count || 0,
      };
    } catch (error) {
      logger.error("Error fetching block stats", error as Error, {
        service: "BlockService",
        method: "getBlockStats",
        userId,
      });
      return {
        total_blocked: 0,
        blocked_by_me: 0,
        blocked_me: 0,
      };
    }
  }

  /**
   * ✅ SSOT: Obter IDs de usuários bloqueados (para filtros)
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.db
        .from(this.TABLE)
        .select("blocked_user_id")
        .eq("blocker_user_id", userId);

      if (error) throw error;

      return ((data || []) as Array<{ blocked_user_id: string }>).map((row) => row.blocked_user_id);
    } catch (error) {
      logger.error("Error fetching blocked user IDs", error as Error, {
        service: "BlockService",
        method: "getBlockedUserIds",
        userId,
      });
      return [];
    }
  }
}

export const blockService = new BlockService();

