/**
 * Role Service
 * 
 * SSOT para operações de roles e autorização baseada em roles.
 * 
 * Alinhado com: supabase/migrations/20260418000000_create_roles_system.sql
 * 
 * REGRAS:
 * - Todas as operações de roles DEVEM passar por este service
 * - Nunca acessar user_roles diretamente de components/pages
 * - Sempre usar as funções do banco (has_role, is_admin, etc)
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import { SessionService } from '@/core/session/services/SessionService';
import { adminRolesService } from '@/core/admin/services/AdminRolesService';
import type {
  AppRole,
  UserRole,
  RoleHistory,
  GrantRoleRequest,
  RevokeRoleRequest,
  RoleCheckResult
} from '../types/roles.types';
// ============================================================================
// ROLE SERVICE
// ============================================================================

export class RoleService {
  /**
   * Verifica se um usuário possui um role específico.
   * 
   * Usa a função `has_role()` do banco (SECURITY DEFINER).
   */
  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: role
    });

    if (error) {
      logger.error('Erro ao verificar role:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Verifica se um usuário é admin (admin ou super_admin).
   * 
   * Usa a função `is_admin()` do banco (SECURITY DEFINER).
   */
  static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_admin', {
      _user_id: userId
    });

    if (error) {
      logger.error('Erro ao verificar admin:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Verifica se um usuário é super admin.
   * 
   * Usa a função `is_super_admin()` do banco (SECURITY DEFINER).
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_super_admin', {
      _user_id: userId
    });

    if (error) {
      logger.error('Erro ao verificar super admin:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Retorna todos os roles ativos de um usuário.
   * 
   * Usa a função `get_user_roles()` do banco (SECURITY DEFINER).
   */
  static async getUserRoles(userId: string): Promise<AppRole[]> {
    const { data, error } = await supabase.rpc('get_user_roles', {
      _user_id: userId
    });

    if (error) {
      logger.error('Erro ao buscar roles do usuário:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Retorna os detalhes completos dos roles de um usuário.
   * 
   * Inclui metadados, datas, etc.
   */
  static async getUserRoleDetails(userId: string): Promise<UserRole[]> {
    try {
      const roles = await adminRolesService.getUserRoles(userId);
      return roles as unknown as UserRole[];
    } catch (error) {
      logger.error('Erro ao buscar detalhes de roles:', error);
      return [];
    }
  }

  /**
   * Concede um role a um usuário.
   * 
   * REQUER: super_admin role (verificado via RLS).
   */
  static async grantRole(request: GrantRoleRequest): Promise<{
    success: boolean;
    error?: string;
    role?: UserRole;
  }> {
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const success = await adminRolesService.grantRole({
      userId: request.user_id,
      role: request.role,
      grantedBy: currentUser.id,
      reason: request.reason,
    });
    if (!success) {
      return { success: false, error: 'Erro ao conceder role' };
    }
    return { success: true };
  }

  /**
   * Revoga um role de um usuário.
   * 
   * REQUER: super_admin role (verificado via RLS).
   */
  static async revokeRole(request: RevokeRoleRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    const success = await adminRolesService.revokeRole({
      userId: request.user_id,
      role: request.role,
      revokedBy: currentUser.id,
      reason: request.reason,
    });
    return success
      ? { success: true }
      : { success: false, error: 'Role não encontrado ou já revogado' };
  }

  /**
   * Retorna o histórico de roles de um usuário.
   * 
   * Visível para o próprio usuário e admins (via RLS).
   */
  static async getRoleHistory(userId: string): Promise<RoleHistory[]> {
    try {
      const data = await adminRolesService.getUserRoleHistory(userId);
      return data as unknown as RoleHistory[];
    } catch (error) {
      logger.error('Erro ao buscar histórico de roles:', error);
      return [];
    }
  }

  /**
   * Verifica múltiplos roles de uma vez.
   * 
   * Útil para verificações de UI (ex: mostrar botões admin).
   */
  static async checkMultipleRoles(
    userId: string, 
    roles: AppRole[]
  ): Promise<Record<AppRole, boolean>> {
    const results = new Map<AppRole, boolean>();

    await Promise.all(
      roles.map(async (role) => {
        results.set(role, await this.hasRole(userId, role));
      })
    );

    return Object.fromEntries(
      roles.map((role) => [role, results.get(role) ?? false]),
    ) as Record<AppRole, boolean>;
  }

  /**
   * Retorna informações completas sobre um role específico de um usuário.
   */
  static async getRoleInfo(
    userId: string, 
    role: AppRole
  ): Promise<RoleCheckResult> {
    const roles = await this.getUserRoleDetails(userId);
    const roleInfo = roles.find((r) => r.role === role);
    if (!roleInfo) {
      return { hasRole: false };
    }

    return {
      hasRole: true,
      role,
      grantedAt: roleInfo.granted_at
    };
  }

  /**
   * Lista todos os usuários com um role específico.
   * 
   * REQUER: admin role (verificado via RLS).
   */
  static async getUsersByRole(role: AppRole): Promise<UserRole[]> {
    try {
      const data = await adminRolesService.getUsersByRole(role);
      return data as unknown as UserRole[];
    } catch (error) {
      logger.error('Erro ao buscar usuários por role:', error);
      return [];
    }
  }

  /**
   * Conta quantos usuários têm um role específico.
   * 
   * REQUER: admin role (verificado via RLS).
   */
  static async countUsersByRole(role: AppRole): Promise<number> {
    const users = await this.getUsersByRole(role);
    return users.length;
  }
}

