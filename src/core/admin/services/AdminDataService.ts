/**
 * AdminDataService - SSOT para operacoes administrativas de dados
 *
 * Encapsula composicao administrativa. Decisoes operacionais de roles passam
 * pelo owner `core/authorization`; mutacoes de role continuam em AdminRolesService.
 *
 * @version 1.0.0
 */

import { RoleService } from "@/core/authorization/services/RoleService";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { UpdateProfilePayload } from "@/core/profiles/services/types";
import { logger } from "@/shared/utils/logger";
import { adminRolesService } from "./AdminRolesService";
import { AdminUserService } from "./AdminUserService";

export class AdminDataService {
  /** Buscar detalhes completos de um usuario (admin only). */
  static async getUserDetails(userId: string) {
    try {
      const profiles = await profileService.getProfilesByUserId(userId);
      if (!profiles || profiles.length === 0) {
        throw new Error("User not found");
      }

      const primaryProfile = profiles[0];
      const roles = await RoleService.getUserRoles(userId);
      const profileMembers = await profileService.getProfileMembers(primaryProfile.id);

      return {
        ...primaryProfile,
        user_roles: roles.map((role) => ({ role })),
        profile_members: profileMembers,
      };
    } catch (error: unknown) {
      logger.error("Error fetching user details:", error);
      throw new Error(
        `Erro ao buscar detalhes do usuario: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Atualizar dados de usuario (admin only). */
  static async updateUserData(userId: string, updates: UpdateProfilePayload) {
    try {
      const profile = await profileService.getProfileContext(userId);
      if (!profile) {
        throw new Error("User profile not found");
      }

      await AdminUserService.updateProfile(profile.id, updates);
      return profileService.getAccessibleProfileById(profile.id);
    } catch (error: unknown) {
      logger.error("Error updating user data:", error);
      throw new Error(
        `Erro ao atualizar usuario: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Buscar roles validos de um usuario via owner de Authorization. */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      return await RoleService.getUserRoles(userId);
    } catch (error: unknown) {
      logger.error("Error fetching user roles:", error);
      return [];
    }
  }

  /** Atualizar role de usuario (admin only) via owner de gestao administrativa. */
  static async updateUserRole(
    userId: string,
    role: string,
    grantedBy: string = "system",
  ) {
    try {
      const success = await adminRolesService.grantRole({
        userId,
        role,
        grantedBy,
      });
      if (!success) {
        throw new Error("Failed to grant role");
      }
    } catch (error: unknown) {
      logger.error("Error updating user role:", error);
      throw new Error(
        `Erro ao atualizar role: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Buscar todos os usuarios (admin only, com paginacao). */
  static async getAllUsers(page = 0, pageSize = 50) {
    try {
      const result = await profileService.getProfilesFiltered({
        page: page + 1,
        limit: pageSize,
      });

      return {
        users: result.data || [],
        total: result.total || 0,
        hasMore: result.total ? result.total > (page + 1) * pageSize : false,
      };
    } catch (error: unknown) {
      logger.error("Error fetching all users:", error);
      throw new Error(
        `Erro ao buscar usuarios: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
