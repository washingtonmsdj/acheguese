/**
 * AdminRolesService - SSOT para gestão de roles administrativossões
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

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

class AdminRolesServiceClass {
  private readonly db = supabase as any;
  /**
   * Lista roles ativos de um usuário.
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const { data, error } = await this.db
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
      return (data || []) as UserRole[];
    } catch (error) {
      logger.error("Error fetching user roles:", error);
      return [];
    }
  }

  /**
   * Lista todos os roles.
   */
  async getRolesList(): Promise<UserRole[]> {
    try {
      const { data, error } = await this.db
        .from("user_roles")
        .select("*")
        .order("granted_at", { ascending: false });

      if (error) throw error;
      return (data || []) as UserRole[];
    } catch (error) {
      logger.error("Error fetching all roles:", error);
      return [];
    }
  }

  /**
   * Verifica se um usuário possui role ativo.
   */
  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const { data, error } = await this.db
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", role)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      logger.error("Error checking user role:", error);
      return false;
    }
  }

  /**
   * Busca estatísticas de roles
   */
  async getStats(): Promise<RoleStats> {
    try {
      const { data: roles, error } = await this.db
        .from("user_roles")
        .select("*");

      if (error) throw error;

      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: RoleStats = {
        totalRoles: roles?.length || 0,
        activeRoles: roles?.filter(r => r.is_active).length || 0,
        expiredRoles: roles?.filter(r => r.expires_at && new Date(r.expires_at) < now).length || 0,
        byRole: {},
        recentGrants: roles?.filter(r => new Date(r.granted_at) > last7Days).length || 0,
      };

      roles?.forEach(r => {
        if (r.role) {
          stats.byRole[r.role] = (stats.byRole[r.role] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Error fetching role stats:", error);
      throw error;
    }
  }

  /**
   * Busca todos os roles com paginação e filtros
   */
  async getAllRoles(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  } = {}) {
    try {
      const { page = 1, limit = 20, search, role, isActive } = params;

      let query = this.db
        .from("user_roles")
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email
          ),
          granter:auth.users!granted_by(
            id,
            email
          )
        `, { count: "exact" });

      if (search) {
        query = query.or(`user.email.ilike.%${search}%`);
      }
      if (role) {
        query = query.eq("role", role);
      }
      if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order("granted_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      logger.error("Error fetching roles:", error);
      throw error;
    }
  }

  /**
   * Concede role com expiração opcional
   */
  async grantRole(params: {
    userId: string;
    role: string;
    grantedBy: string;
    expiresAt?: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const { userId, role, grantedBy, expiresAt, reason } = params;

      const { error } = await this.db.from("user_roles").insert([
        {
          user_id: userId,
          role,
          role_enum: role,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true,
        },
      ] as any);

      if (error) throw error;

      // Registrar no histórico
      await this.logRoleHistory({
        userId,
        role,
        action: "granted",
        grantedBy,
        reason,
      });

      return true;
    } catch (error) {
      logger.error("Error granting role:", error);
      return false;
    }
  }

  /**
   * Revoga role
   */
  async revokeRole(params: {
    userId: string;
    role: string;
    revokedBy: string;
    reason?: string;
  }): Promise<boolean> {
    try {
      const { userId, role, revokedBy, reason } = params;

      const { error } = await this.db
        .from("user_roles")
        .update({ 
          is_active: false,
          revoked_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      // Registrar no histórico
      await this.logRoleHistory({
        userId,
        role,
        action: "revoked",
        grantedBy: revokedBy,
        reason,
      });

      return true;
    } catch (error) {
      logger.error("Error revoking role:", error);
      return false;
    }
  }

  /**
   * Busca histórico de roles de um usuário
   */
  async getUserRoleHistory(userId: string): Promise<RoleHistory[]> {
    try {
      const { data, error } = await this.db
        .from("role_history")
        .select("*")
        .eq("user_id", userId)
        .order("granted_at", { ascending: false });

      if (error) throw error;
      return (data as RoleHistory[]) || [];
    } catch (error) {
      logger.error("Error fetching role history:", error);
      return [];
    }
  }

  /**
   * Busca roles que estão prestes a expirar
   */
  async getExpiringRoles(daysAhead: number = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await this.db
        .from("user_roles")
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `)
        .eq("is_active", true)
        .not("expires_at", "is", null)
        .lte("expires_at", futureDate.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching expiring roles:", error);
      return [];
    }
  }

  /**
   * Renova role (estende expiração)
   */
  async renewRole(params: {
    userId: string;
    role: string;
    newExpiresAt: string;
    renewedBy: string;
  }): Promise<boolean> {
    try {
      const { userId, role, newExpiresAt, renewedBy } = params;

      const { error } = await this.db
        .from("user_roles")
        .update({ expires_at: newExpiresAt })
        .eq("user_id", userId)
        .eq("role", role)
        .eq("is_active", true);

      if (error) throw error;

      // Registrar no histórico
      await this.logRoleHistory({
        userId,
        role,
        action: "granted",
        grantedBy: renewedBy,
        reason: "Role renewed",
      });

      return true;
    } catch (error) {
      logger.error("Error renewing role:", error);
      return false;
    }
  }

  /**
   * Registra ação no histórico de roles
   */
  private async logRoleHistory(params: {
    userId: string;
    role: string;
    action: "granted" | "revoked" | "expired";
    grantedBy?: string;
    reason?: string;
  }): Promise<void> {
    try {
      const { userId, role, action, grantedBy, reason } = params;

      await this.db.from("role_history").insert([
        {
          user_id: userId,
          role,
          action,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
          reason,
        },
      ] as any);
    } catch (error) {
      logger.error("Error logging role history:", error);
    }
  }

  /**
   * Busca usuários por role
   */
  async getUsersByRole(role: string) {
    try {
      const { data, error } = await this.db
        .from("user_roles")
        .select(`
          *,
          user:auth.users!user_id(
            id,
            email
          )
        `)
        .eq("role", role)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching users by role:", error);
      return [];
    }
  }
}

export const adminRolesService = new AdminRolesServiceClass();
