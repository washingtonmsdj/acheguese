/**
 * AdminUserService - SSOT para gestão de usuários no painel admin
 *
 * Distingue corretamente:
 * - Usuário (auth.users): conta de autenticação, tem email/phone
 * - Perfil (profiles): representação de identidade, um usuário pode ter vários
 *
 * ✅ SEGURO: Usa edge functions ao invés de supabaseAdmin
 */

import { supabase } from "@/integrations/supabase";
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
   * ✅ SEGURO: Usa edge function admin-list-users
   */
  static async listUsers(
    page = 0,
    pageSize = 50,
    search?: string,
  ): Promise<AdminUserListResult> {
    try {
      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { page, pageSize, search },
      });

      if (error) throw error;

      // A edge function já retorna no formato correto
      return data as AdminUserListResult;
    } catch (error: any) {
      logger.error("AdminUserService.listUsers error:", error);
      throw error;
    }
  }

  /**
   * Busca detalhes completos de um usuário pelo user_id.
   * ✅ SEGURO: Usa edge function admin-get-user
   */
  static async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('admin-get-user', {
        body: { userId },
      });

      if (error) throw error;

      // A edge function já retorna no formato correto
      return data?.user as AdminUser | null;
    } catch (error: any) {
      logger.error("AdminUserService.getUserById error:", error);
      return null;
    }
  }

  /**
   * Suspende todos os perfis de um usuário.
   * ✅ Usa supabase normal com RLS (admin tem permissão)
   */
  static async suspendUser(
    userId: string,
    reason: string,
    suspendedUntil?: Date,
  ): Promise<void> {
    const { error } = await supabase
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
   * ✅ Usa supabase normal com RLS (admin tem permissão)
   */
  static async unsuspendUser(userId: string): Promise<void> {
    const { error } = await supabase
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
   * ✅ Usa supabase normal com RLS (admin tem permissão)
   */
  static async verifyUser(profileId: string): Promise<void> {
    const { error } = await supabase
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
