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

import { supabase } from '@/integrations/supabase/client';
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
      console.error('Erro ao verificar role:', error);
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
      console.error('Erro ao verificar admin:', error);
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
      console.error('Erro ao verificar super admin:', error);
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
      console.error('Erro ao buscar roles do usuário:', error);
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
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes de roles:', error);
      return [];
    }

    return data || [];
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
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: request.user_id,
        role: request.role,
        granted_by: currentUser.user.id,
        reason: request.reason || null,
        metadata: request.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao conceder role:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao conceder role' 
      };
    }

    return { success: true, role: data };
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
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser.user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Buscar o role ativo
    const { data: existingRole, error: fetchError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', request.user_id)
      .eq('role', request.role)
      .is('revoked_at', null)
      .single();

    if (fetchError || !existingRole) {
      return { 
        success: false, 
        error: 'Role não encontrado ou já revogado' 
      };
    }

    // Revogar o role
    const { error } = await supabase
      .from('user_roles')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: currentUser.user.id,
        reason: request.reason || null
      })
      .eq('id', existingRole.id);

    if (error) {
      console.error('Erro ao revogar role:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao revogar role' 
      };
    }

    return { success: true };
  }

  /**
   * Retorna o histórico de roles de um usuário.
   * 
   * Visível para o próprio usuário e admins (via RLS).
   */
  static async getRoleHistory(userId: string): Promise<RoleHistory[]> {
    const { data, error } = await supabase
      .from('role_history')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de roles:', error);
      return [];
    }

    return data || [];
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
    const results: Record<string, boolean> = {};

    await Promise.all(
      roles.map(async (role) => {
        results[role] = await this.hasRole(userId, role);
      })
    );

    return results as Record<AppRole, boolean>;
  }

  /**
   * Retorna informações completas sobre um role específico de um usuário.
   */
  static async getRoleInfo(
    userId: string, 
    role: AppRole
  ): Promise<RoleCheckResult> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('granted_at')
      .eq('user_id', userId)
      .eq('role', role)
      .is('revoked_at', null)
      .single();

    if (error || !data) {
      return { hasRole: false };
    }

    return {
      hasRole: true,
      role,
      grantedAt: data.granted_at
    };
  }

  /**
   * Lista todos os usuários com um role específico.
   * 
   * REQUER: admin role (verificado via RLS).
   */
  static async getUsersByRole(role: AppRole): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', role)
      .is('revoked_at', null)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários por role:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Conta quantos usuários têm um role específico.
   * 
   * REQUER: admin role (verificado via RLS).
   */
  static async countUsersByRole(role: AppRole): Promise<number> {
    const { count, error } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .is('revoked_at', null);

    if (error) {
      console.error('Erro ao contar usuários por role:', error);
      return 0;
    }

    return count || 0;
  }
}
