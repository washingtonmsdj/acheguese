import { supabase } from "@/integrations/supabase";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { buildSafeOrILikeFilter } from "@/shared/utils/sqlSanitization";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  or(filters: string): TableClient<TRow>;
  not(column: string, operator: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  range(from: number, to: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type AdminRolesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminRolesDbClient;

type AppRole = Database["public"]["Enums"]["app_role"];
type UserRoleRow = Tables<"user_roles">;
type UserRoleInsert = TablesInsert<"user_roles">;
type UserRoleUpdate = TablesUpdate<"user_roles">;
type RoleHistoryRow = Tables<"role_history">;
type RoleHistoryInsert = TablesInsert<"role_history">;

type UserSummary = {
  id: string;
  email: string | null;
};

type UserRoleWithRelationsRow = UserRoleRow & {
  user?: UserSummary | readonly UserSummary[] | null;
  granter?: UserSummary | readonly UserSummary[] | null;
};

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  expiredRoles: number;
  byRole: Record<string, number>;
  recentGrants: number;
}

export interface RoleHistory {
  id: string;
  user_id: string;
  role: string;
  action: "granted" | "revoked" | "expired";
  granted_by?: string;
  granted_at: string;
  revoked_at?: string;
  expires_at?: string;
  reason?: string;
}

function isUserSummaryArray(
  value: UserRoleWithRelationsRow["user"] | UserRoleWithRelationsRow["granter"],
): value is readonly UserSummary[] {
  return Array.isArray(value);
}

function normalizeUserRelation(
  value: UserRoleWithRelationsRow["user"] | UserRoleWithRelationsRow["granter"],
): UserSummary | null {
  if (isUserSummaryArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function normalizeRoleEnum(role: string): AppRole {
  return role as AppRole;
}

function mapUserRole(row: UserRoleRow): UserRole {
  return {
    id: row.id,
    user_id: row.user_id,
    role: row.role,
    granted_by: row.granted_by ?? undefined,
    granted_at: row.granted_at,
    expires_at: row.expires_at ?? undefined,
    is_active: row.is_active,
  };
}

function mapRoleHistory(row: RoleHistoryRow): RoleHistory {
  return {
    id: row.id,
    user_id: row.user_id,
    role: row.role,
    action: row.action as RoleHistory["action"],
    granted_by: row.performed_by ?? undefined,
    granted_at: row.performed_at,
    revoked_at: undefined,
    expires_at: undefined,
    reason: row.reason ?? undefined,
  };
}

function toUserRoleInsert(params: {
  userId: string;
  role: string;
  grantedBy: string;
  expiresAt?: string;
  reason?: string;
}): UserRoleInsert {
  return {
    user_id: params.userId,
    role: params.role,
    role_enum: normalizeRoleEnum(params.role),
    granted_by: params.grantedBy,
    granted_at: new Date().toISOString(),
    expires_at: params.expiresAt ?? null,
    is_active: true,
    reason: params.reason ?? null,
  };
}

class AdminRolesServiceClass {
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await db
        .from<UserRoleRow>("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
      return (data ?? []).map(mapUserRole);
    } catch (error) {
      logger.error("AdminRolesService.getUserRoles", error as Error, { userId });
      return [];
    }
  }

  async getRolesList(): Promise<UserRole[]> {
    try {
      const { data, error } = await db
        .from<UserRoleRow>("user_roles")
        .select("*")
        .order("granted_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapUserRole);
    } catch (error) {
      logger.error("AdminRolesService.getRolesList", error as Error);
      return [];
    }
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const { data, error } = await db
        .from<Pick<UserRoleRow, "id">>("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      logger.error("AdminRolesService.hasRole", error as Error, { userId, role });
      return false;
    }
  }

  async getStats(): Promise<RoleStats> {
    try {
      const { data, error } = await db
        .from<UserRoleRow>("user_roles")
        .select("*");

      if (error) throw error;

      const roles = data ?? [];
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: RoleStats = {
        totalRoles: roles.length,
        activeRoles: roles.filter((role) => role.is_active).length,
        expiredRoles: roles.filter(
          (role) => Boolean(role.expires_at && new Date(role.expires_at) < now),
        ).length,
        byRole: {},
        recentGrants: roles.filter((role) => new Date(role.granted_at) > last7Days).length,
      };

      for (const role of roles) {
        stats.byRole[role.role] = (stats.byRole[role.role] ?? 0) + 1;
      }

      return stats;
    } catch (error) {
      logger.error("AdminRolesService.getStats", error as Error);
      throw error;
    }
  }

  async getAllRoles(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  } = {}) {
    try {
      const { page = 1, limit = 20, search, role, isActive } = params;

      let query = db.from<UserRoleWithRelationsRow>("user_roles").select(
        `
          *,
          user:auth.users!user_id(
            id,
            email
          ),
          granter:auth.users!granted_by(
            id,
            email
          )
        `,
        { count: "exact" },
      );

      if (search) {
        const searchFilter = buildSafeOrILikeFilter(["user.email"], search);
        if (searchFilter) {
          query = query.or(searchFilter);
        }
      }

      if (role) {
        query = query.eq("role", role);
      }

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error, count } = await query
        .range(from, to)
        .order("granted_at", { ascending: false });

      if (error) throw error;

      return {
        data: (data ?? []).map((row) => ({
          ...mapUserRole(row),
          user: normalizeUserRelation(row.user),
          granter: normalizeUserRelation(row.granter),
        })),
        count: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      };
    } catch (error) {
      logger.error("AdminRolesService.getAllRoles", error as Error, params);
      throw error;
    }
  }

  async grantRole(params: {
    userId: string;
    role: string;
    grantedBy: string;
    expiresAt?: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const payload = toUserRoleInsert(params);
      const { error } = await db
        .from<UserRoleRow>("user_roles")
        .insert(payload);

      if (error) throw error;

      await this.logRoleHistory({
        userId: params.userId,
        role: params.role,
        action: "granted",
        grantedBy: params.grantedBy,
        reason: params.reason,
      });

      return true;
    } catch (error) {
      logger.error("AdminRolesService.grantRole", error as Error, params);
      return false;
    }
  }

  async revokeRole(params: {
    userId: string;
    role: string;
    revokedBy: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const patch: Partial<UserRoleUpdate> = {
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: params.revokedBy,
        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<UserRoleRow>("user_roles")
        .update(patch)
        .eq("user_id", params.userId)
        .eq("role", params.role);

      if (error) throw error;

      await this.logRoleHistory({
        userId: params.userId,
        role: params.role,
        action: "revoked",
        grantedBy: params.revokedBy,
        reason: params.reason,
      });

      return true;
    } catch (error) {
      logger.error("AdminRolesService.revokeRole", error as Error, params);
      return false;
    }
  }

  async getUserRoleHistory(userId: string): Promise<RoleHistory[]> {
    try {
      const { data, error } = await db
        .from<RoleHistoryRow>("role_history")
        .select("*")
        .eq("user_id", userId)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      return (data ?? []).map(mapRoleHistory);
    } catch (error) {
      logger.error("AdminRolesService.getUserRoleHistory", error as Error, { userId });
      return [];
    }
  }

  async getExpiringRoles(daysAhead = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await db.from<UserRoleWithRelationsRow>("user_roles").select(
        `
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `,
      )
        .eq("is_active", true)
        .not("expires_at", "is", null)
        .lte("expires_at", futureDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...mapUserRole(row),
        user: normalizeUserRelation(row.user),
      }));
    } catch (error) {
      logger.error("AdminRolesService.getExpiringRoles", error as Error, { daysAhead });
      return [];
    }
  }

  async renewRole(params: {
    userId: string;
    role: string;
    newExpiresAt: string;
    renewedBy: string;
  }): Promise<boolean> {
    try {
      const patch: Partial<UserRoleUpdate> = {
        expires_at: params.newExpiresAt,
        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from<UserRoleRow>("user_roles")
        .update(patch)
        .eq("user_id", params.userId)
        .eq("role", params.role)
        .eq("is_active", true);

      if (error) throw error;

      await this.logRoleHistory({
        userId: params.userId,
        role: params.role,
        action: "granted",
        grantedBy: params.renewedBy,
        reason: "Role renewed",
      });

      return true;
    } catch (error) {
      logger.error("AdminRolesService.renewRole", error as Error, params);
      return false;
    }
  }

  private async logRoleHistory(params: {
    userId: string;
    role: string;
    action: "granted" | "revoked" | "expired";
    grantedBy?: string;
    reason?: string;
  }): Promise<void> {
    try {
      const payload: RoleHistoryInsert = {
        user_id: params.userId,
        role: normalizeRoleEnum(params.role),
        action: params.action,
        performed_by: params.grantedBy ?? null,
        performed_at: new Date().toISOString(),
        reason: params.reason ?? null,
      };

      const { error } = await db
        .from<RoleHistoryRow>("role_history")
        .insert(payload);

      if (error) throw error;
    } catch (error) {
      logger.error("AdminRolesService.logRoleHistory", error as Error, params);
    }
  }

  async getUsersByRole(role: string) {
    try {
      const { data, error } = await db.from<UserRoleWithRelationsRow>("user_roles").select(
        `
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `,
      )
        .eq("role", role)
        .eq("is_active", true);

      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...mapUserRole(row),
        user: normalizeUserRelation(row.user),
      }));
    } catch (error) {
      logger.error("AdminRolesService.getUsersByRole", error as Error, { role });
      return [];
    }
  }
}

export const adminRolesService = new AdminRolesServiceClass();
