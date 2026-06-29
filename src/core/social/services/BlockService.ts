/**
 * BlockService - SSOT para bloqueios de usuarios
 *
 * Fonte unica de verdade para gerenciamento de bloqueios.
 * Todas as operacoes de bloqueio passam por aqui.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

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

type QueryResult<T> = Promise<{
  data: T;
  error: { code?: string; message?: string } | null;
  count?: number | null;
}>;

interface QueryBuilder<TRow> {
  select(
    columns?: string,
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
  ): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  or(filters: string): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  limit(count: number): QueryBuilder<TRow>;
  single(): QueryResult<TRow>;
  then<
    TResult1 = {
      data: TRow[];
      error: { code?: string; message?: string } | null;
      count?: number | null;
    },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((
          value: {
            data: TRow[];
            error: { code?: string; message?: string } | null;
            count?: number | null;
          },
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface BlockDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

type UserBlockRow = Omit<BlockedUser, "blocked_profile"> & {
  blocked_profile?:
    | {
        id: string;
        name: string;
        username: string;
        avatar_url: string;
      }
    | Array<{
        id: string;
        name: string;
        username: string;
        avatar_url: string;
      }>
    | null;
};

class BlockService {
  private readonly table = "user_blocks";
  private readonly db = supabase as unknown as BlockDbClient;

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      const { data, error } = await this.db
        .from<UserBlockRow>(this.table)
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

      if (error) {
        throw error;
      }

      return (data || []).map((row) => ({
        ...row,
        blocked_profile: Array.isArray(row.blocked_profile)
          ? row.blocked_profile[0]
          : row.blocked_profile || undefined,
      }));
    } catch (error) {
      logger.error("Error fetching blocked users", error as Error, {
        service: "BlockService",
        method: "getBlockedUsers",
        userId,
      });
      throw error;
    }
  }

  async blockUser(
    blockerUserId: string,
    blockedUserId: string,
    reason?: string,
  ): Promise<boolean> {
    try {
      const { data: existing } = await this.db
        .from<Pick<UserBlockRow, "id">>(this.table)
        .select("id")
        .eq("blocker_user_id", blockerUserId)
        .eq("blocked_user_id", blockedUserId)
        .single();

      if (existing) {
        return true;
      }

      const { error } = await this.db.from<UserBlockRow>(this.table).insert({
        blocker_user_id: blockerUserId,
        blocked_user_id: blockedUserId,
        reason,
        created_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

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

  async unblockUser(
    blockerUserId: string,
    blockedUserId: string,
  ): Promise<boolean> {
    try {
      const { error } = await this.db
        .from<UserBlockRow>(this.table)
        .delete()
        .eq("blocker_user_id", blockerUserId)
        .eq("blocked_user_id", blockedUserId);

      if (error) {
        throw error;
      }

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

  async isBlocked(blockerUserId: string, blockedUserId: string): Promise<boolean> {
    try {
      const { data, error } = await this.db
        .from<Pick<UserBlockRow, "id">>(this.table)
        .select("id")
        .eq("blocker_user_id", blockerUserId)
        .eq("blocked_user_id", blockedUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

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

  async isMutuallyBlocked(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data, error } = await this.db
        .from<Pick<UserBlockRow, "id">>(this.table)
        .select("id")
        .or(
          `and(blocker_user_id.eq.${userId1},blocked_user_id.eq.${userId2}),and(blocker_user_id.eq.${userId2},blocked_user_id.eq.${userId1})`,
        )
        .limit(1);

      if (error) {
        throw error;
      }

      return !!(data && data.length > 0);
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

  async getBlockStats(userId: string): Promise<BlockStats> {
    try {
      const [blockedByMe, blockedMe] = await Promise.all([
        this.db
          .from<Pick<UserBlockRow, "id">>(this.table)
          .select("id", { count: "exact", head: true })
          .eq("blocker_user_id", userId),
        this.db
          .from<Pick<UserBlockRow, "id">>(this.table)
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

  async getBlockedUserIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.db
        .from<Pick<UserBlockRow, "blocked_user_id">>(this.table)
        .select("blocked_user_id")
        .eq("blocker_user_id", userId);

      if (error) {
        throw error;
      }

      return (data || []).map((row) => row.blocked_user_id);
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
