/**
 * AdminUserService - SSOT para gestão de usuários no painel admin
 *
 * Distingue corretamente:
 * - Usuário (auth.users): conta de autenticação, tem email/phone
 * - Perfil (profiles): representação de identidade, um usuário pode ter vários
 *
 * ✅ SEGURO: Usa edge functions ao invés de supabaseAdmin
 */

import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { adminRolesService } from "./AdminRolesService";
import { VerificationAdminService } from "@/core/verification";

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
  public_neighborhood: string | null;
  public_city: string | null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseUserListResponse(value: unknown): AdminUserListResult {
  if (!isRecord(value)) {
    throw new Error("Invalid admin user list response");
  }

  const { users, total, page, pageSize } = value;
  if (
    !Array.isArray(users) ||
    !isNonNegativeInteger(total) ||
    !isNonNegativeInteger(page) ||
    !isNonNegativeInteger(pageSize)
  ) {
    throw new Error("Invalid admin user list response");
  }

  return {
    users: users as AdminUser[],
    total,
    page,
    pageSize,
  };
}

async function edgeError(error: unknown, fallback: string): Promise<Error> {
  const message = await resolveSupabaseFunctionErrorMessage(error);
  return new Error(message ?? fallback);
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
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { page, pageSize, search },
      });

      if (error) {
        throw await edgeError(error, "Failed to list admin users");
      }
      return parseUserListResponse(data);
    } catch (error: unknown) {
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
      const { data, error } = await supabase.functions.invoke('admin-get-user', {
        body: { userId },
      });

      if (error) {
        throw await edgeError(error, "Failed to load admin user");
      }
      if (!isRecord(data) || !isRecord(data.user)) {
        throw new Error("Invalid admin user response");
      }
      return data.user as unknown as AdminUser;
    } catch (error: unknown) {
      logger.error("AdminUserService.getUserById error:", error);
      return null;
    }
  }

  private static async setSuspension(params: {
    targetKind: "profile" | "user";
    targetId: string;
    suspended: boolean;
    reason?: string;
    suspendedUntil?: Date;
  }): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      "admin-suspend-profile",
      {
        body: {
          action: params.suspended ? "suspend" : "unsuspend",
          target_kind: params.targetKind,
          target_id: params.targetId,
          reason: params.reason ?? null,
          suspended_until:
            params.suspended && params.suspendedUntil
              ? params.suspendedUntil.toISOString()
              : null,
        },
      },
    );

    if (error) {
      throw await edgeError(error, "Falha ao atualizar suspensão");
    }
    if (!isRecord(data) || data.success !== true) {
      const message = isRecord(data) && typeof data.error === "string"
        ? data.error
        : "Falha ao atualizar suspensão";
      throw new Error(message);
    }
  }

  static async suspendProfile(
    profileId: string,
    reason: string,
    suspendedUntil?: Date,
  ): Promise<void> {
    await this.setSuspension({
      targetKind: "profile",
      targetId: profileId,
      suspended: true,
      reason,
      suspendedUntil,
    });
  }

  static async unsuspendProfile(profileId: string): Promise<void> {
    await this.setSuspension({
      targetKind: "profile",
      targetId: profileId,
      suspended: false,
    });
  }

  static async suspendUser(
    userId: string,
    reason: string,
    suspendedUntil?: Date,
  ): Promise<void> {
    await this.setSuspension({
      targetKind: "user",
      targetId: userId,
      suspended: true,
      reason,
      suspendedUntil,
    });
  }

  static async unsuspendUser(userId: string): Promise<void> {
    await this.setSuspension({
      targetKind: "user",
      targetId: userId,
      suspended: false,
    });
  }

  /** Verifica o perfil principal de um usuário. */
  static async verifyUser(profileId: string): Promise<void> {
    await VerificationAdminService.verifyProfile(
      profileId,
      "Aprovacao administrativa pelo painel de usuarios",
    );
  }

  /**
   * Concede ou revoga role global. O ator nunca é recebido da UI: o
   * `admin-role-rpc` deriva o super_admin autenticado do JWT e exige AAL2.
   */
  static async setRole(
    userId: string,
    role: string,
    grant: boolean,
  ): Promise<void> {
    if (grant) {
      const success = await adminRolesService.grantRole({ userId, role });
      if (!success) {
        throw new Error(`Failed to grant role ${role} to user ${userId}`);
      }
    } else {
      const success = await adminRolesService.revokeRole({ userId, role });
      if (!success) {
        throw new Error(`Failed to revoke role ${role} from user ${userId}`);
      }
    }
  }
}