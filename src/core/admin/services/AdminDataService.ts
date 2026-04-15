// @ts-nocheck
/**
 * AdminDataService - SSOT para operações administrativas de dados
 * 
 * Encapsula acesso ao Supabase Admin para operações administrativas.
 * Modules devem usar este service ao invés de acessar integrations diretamente.
 * 
 * @version 1.0.0
 */

import { logger } from "@/shared/utils/logger";
import { adminRolesService } from "./AdminRolesService";
import { ProfileService } from "@/core/profiles/services/ProfileService";

export class AdminDataService {
  /**
   * Buscar detalhes completos de um usuário (admin only)
   * ✅ SSOT: Delega para ProfileService
   */
  static async getUserDetails(userId: string) {
    try {
      // Buscar perfis do usuário via ProfileService
      const profiles = await ProfileService.getProfilesByUserId(userId);
      if (!profiles || profiles.length === 0) {
        throw new Error('User not found');
      }

      // Buscar roles via AdminRolesService
      const roles = await adminRolesService.getUserRoles(userId);

      // Retornar primeiro perfil com roles anexados
      return {
        ...profiles[0],
        user_roles: roles.map(r => ({ role: r.role })),
        profile_members: [], // TODO: Implementar via serviço apropriado se necessário
      };
    } catch (error: any) {
      logger.error('Error fetching user details:', error);
      throw new Error(`Erro ao buscar detalhes do usuário: ${error.message}`);
    }
  }

  /**
   * Atualizar dados de usuário (admin only)
   * ✅ SSOT: Delega para ProfileService
   */
  static async updateUserData(userId: string, updates: Record<string, any>) {
    try {
      // Buscar perfil ativo do usuário
      const profile = await ProfileService.getActiveProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Atualizar via ProfileService
      return await ProfileService.updateProfile(profile.id, updates);
    } catch (error: any) {
      logger.error('Error updating user data:', error);
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  /**
   * Buscar roles de um usuário (admin only)
   * ✅ SSOT: Delega para AdminRolesService
   */
  static async getUserRoles(userId: string): Promise<string[]> {
    try {
      const roles = await adminRolesService.getUserRoles(userId);
      return roles.map(r => r.role);
    } catch (error: any) {
      logger.error('Error fetching user roles:', error);
      return [];
    }
  }

  /**
   * Atualizar role de usuário (admin only)
   * ✅ SSOT: Delega para AdminRolesService
   */
  static async updateUserRole(userId: string, role: string, grantedBy: string = 'system') {
    try {
      const success = await adminRolesService.grantRole({
        userId,
        role,
        grantedBy,
      });
      if (!success) {
        throw new Error('Failed to grant role');
      }
    } catch (error: any) {
      logger.error('Error updating user role:', error);
      throw new Error(`Erro ao atualizar role: ${error.message}`);
    }
  }

  /**
   * Buscar todos os usuários (admin only, com paginação)
   * ✅ SSOT: Delega para ProfileService
   */
  static async getAllUsers(page = 0, pageSize = 50) {
    try {
      const profileService = new ProfileService();
      const result = await profileService.getProfilesFiltered({
        page: page + 1, // getProfilesFiltered usa 1-based
        limit: pageSize,
      });

      return {
        users: result.data || [],
        total: result.total || 0,
        hasMore: result.total ? result.total > (page + 1) * pageSize : false,
      };
    } catch (error: any) {
      logger.error('Error fetching all users:', error);
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }
  }
}
