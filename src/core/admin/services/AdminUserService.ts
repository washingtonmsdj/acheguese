// @ts-nocheck
/**
 * AdminUserService - SSOT para gestão de usuários no painel admin
 *
 * Distingue corretamente:
 * - Usuário (auth.users): conta de autenticação, tem email/phone
 * - Perfil (profiles): representação de identidade, um usuário pode ter vários
 *
 * Requer supabaseAdmin (SUPABASE_SERVICE_ROLE_KEY).
 */

import { supabaseAdmin } from "@/integrations/supabase/supabaseAdmin";
import { logger } from "@/shared/utils/logger";
import { adminRolesService } from "./AdminRolesService";

export interface AdminUser {
  /** ID do auth.users */
  user_id: string;
  email: string;
  phone: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  /** Perfil principal (personal) ou o primeiro encontrado */
  primary_profile: AdminUserProfile;
  /** Todos os perfis do usuário */
  profiles: AdminUserProfile[];
  roles: string[];
}

export interface AdminUserProfile {
  id: string;
  profile_type: string;
  name: string;
  username: string;
  avatar_url: string | null;
  neighborhood: string | null;
  city: string;
  verified: boolean;
  is_active: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  reputation: number;
  created_at: string;
}

export interface AdminUserListResult {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export class AdminUserService {
  /**
   * Lista usuários únicos (agrupados por user_id) com seus perfis.
   * Usa auth.admin.listUsers para obter dados reais de autenticação.
   */
  static async listUsers(
    page = 0,
    pageSize = 50,
    search?: string,
  ): Promise<AdminUserListResult> {
    if (!supabaseAdmin) {
      throw new Error("supabaseAdmin não disponível — configure SUPABASE_SERVICE_ROLE_KEY");
    }

    try {
      // 1. Buscar usuários do auth (paginado)
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.listUsers({
          page: page + 1, // Supabase auth usa 1-indexed
          perPage: pageSize,
        });

      if (authError) throw authError;

      const authUsers = authData.users;
      const total = (authData as any).total ?? authUsers.length;

      if (authUsers.length === 0) {
        return { users: [], total, page, pageSize };
      }

      const userIds = authUsers.map((u) => u.id);

      // 2. Buscar todos os perfis desses usuários em uma query
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, user_id, profile_type, name, username, avatar_url, neighborhood, city, verified, is_active, is_suspended, suspended_until, suspension_reason, reputation, created_at",
        )
        .in("user_id", userIds)
        .order("created_at", { ascending: true });

      if (profilesError) throw profilesError;

      // 3. Buscar roles de todos esses usuários usando AdminRolesService
      // ✅ SSOT: Usar AdminRolesService em vez de acesso direto
      const rolesByUser = new Map<string, string[]>();
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const roles = await adminRolesService.getUserRoles(userId);
            if (roles && roles.length > 0) {
              rolesByUser.set(userId, roles.map(r => r.role));
            }
          } catch (error) {
            logger.error(`Error fetching roles for user ${userId}:`, error);
          }
        })
      );

      // 4. Agrupar perfis e roles por user_id
      const profilesByUser = new Map<string, AdminUserProfile[]>();
      for (const p of profilesData ?? []) {
        const list = profilesByUser.get(p.user_id) ?? [];
        list.push({
          id: p.id,
          profile_type: p.profile_type,
          name: p.name,
          username: p.username,
          avatar_url: p.avatar_url,
          neighborhood: p.neighborhood,
          city: p.city,
          verified: p.verified ?? false,
          is_active: p.is_active ?? true,
          is_suspended: p.is_suspended ?? false,
          suspended_until: p.suspended_until,
          suspension_reason: p.suspension_reason,
          reputation: p.reputation ?? 0,
          created_at: p.created_at,
        });
        profilesByUser.set(p.user_id, list);
      }

      // 4. Montar AdminUser — só inclui usuários que têm ao menos um perfil
      let users: AdminUser[] = authUsers
        .map((authUser) => {
          const profiles = profilesByUser.get(authUser.id) ?? [];
          if (profiles.length === 0) return null;

          const primary =
            profiles.find((p) => p.profile_type === "personal") ?? profiles[0];

          return {
            user_id: authUser.id,
            email: authUser.email ?? "",
            phone: authUser.phone ?? "",
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at ?? null,
            email_confirmed: !!authUser.email_confirmed_at,
            primary_profile: primary,
            profiles,
            roles: rolesByUser.get(authUser.id) ?? [],
          } satisfies AdminUser;
        })
        .filter((u): u is AdminUser => u !== null);

      // 5. Filtro de busca (client-side sobre o resultado paginado)
      if (search?.trim()) {
        const q = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            u.primary_profile.name?.toLowerCase().includes(q) ||
            u.primary_profile.username?.toLowerCase().includes(q),
        );
      }

      return { users, total, page, pageSize };
    } catch (error: any) {
      logger.error("AdminUserService.listUsers error:", error);
      throw error;
    }
  }

  /**
   * Busca detalhes completos de um usuário pelo user_id.
   */
  static async getUserById(userId: string): Promise<AdminUser | null> {
    if (!supabaseAdmin) {
      throw new Error("supabaseAdmin não disponível");
    }

    try {
      // ✅ SSOT: Usar AdminRolesService para buscar roles
      const [authResult, profilesResult, rolesData] = await Promise.all([
        supabaseAdmin.auth.admin.getUserById(userId),
        supabaseAdmin
          .from("profiles")
          .select(
            "id, user_id, profile_type, name, username, avatar_url, neighborhood, city, verified, is_active, is_suspended, suspended_until, suspension_reason, reputation, created_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        adminRolesService.getUserRoles(userId),
      ]);

      if (authResult.error) throw authResult.error;
      if (profilesResult.error) throw profilesResult.error;

      const authUser = authResult.data.user;
      const profiles: AdminUserProfile[] = (profilesResult.data ?? []).map((p) => ({
        id: p.id,
        profile_type: p.profile_type,
        name: p.name,
        username: p.username,
        avatar_url: p.avatar_url,
        neighborhood: p.neighborhood,
        city: p.city,
        verified: p.verified ?? false,
        is_active: p.is_active ?? true,
        is_suspended: p.is_suspended ?? false,
        suspended_until: p.suspended_until,
        suspension_reason: p.suspension_reason,
        reputation: p.reputation ?? 0,
        created_at: p.created_at,
      }));

      if (profiles.length === 0) return null;

      const primary =
        profiles.find((p) => p.profile_type === "personal") ?? profiles[0];

      return {
        user_id: authUser.id,
        email: authUser.email ?? "",
        phone: authUser.phone ?? "",
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
        email_confirmed: !!authUser.email_confirmed_at,
        primary_profile: primary,
        profiles,
        roles: rolesData.map(r => r.role),
      };
    } catch (error: any) {
      logger.error("AdminUserService.getUserById error:", error);
      return null;
    }
  }

  /**
   * Suspende todos os perfis de um usuário.
   */
  static async suspendUser(
    userId: string,
    reason: string,
    suspendedUntil?: Date,
  ): Promise<void> {
    if (!supabaseAdmin) throw new Error("supabaseAdmin não disponível");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_suspended: true,
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_until: suspendedUntil?.toISOString() ?? null,
      })
      .eq("user_id", userId);

    if (error) throw error;
  }

  /**
   * Remove suspensão de todos os perfis de um usuário.
   */
  static async unsuspendUser(userId: string): Promise<void> {
    if (!supabaseAdmin) throw new Error("supabaseAdmin não disponível");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspended_until: null,
      })
      .eq("user_id", userId);

    if (error) throw error;
  }

  /**
   * Verifica o perfil principal de um usuário.
   */
  static async verifyUser(profileId: string): Promise<void> {
    if (!supabaseAdmin) throw new Error("supabaseAdmin não disponível");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("id", profileId);

    if (error) throw error;
  }

  /**
   * Concede ou revoga role de admin.
   * ✅ SSOT: Delega para AdminRolesService
   */
  static async setRole(
    userId: string,
    role: string,
    grant: boolean,
    grantedBy: string,
  ): Promise<void> {
    if (!supabaseAdmin) throw new Error("supabaseAdmin não disponível");

    if (grant) {
      const success = await adminRolesService.grantRole({
        userId,
        role,
        grantedBy,
      });
      if (!success) {
        throw new Error(`Failed to grant role ${role} to user ${userId}`);
      }
    } else {
      const success = await adminRolesService.revokeRole({
        userId,
        role,
        revokedBy: grantedBy,
      });
      if (!success) {
        throw new Error(`Failed to revoke role ${role} from user ${userId}`);
      }
    }
  }
}
