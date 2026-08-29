/**
 * Role Service
 *
 * SSOT de leitura operacional para roles globais da plataforma.
 *
 * Autoridade de banco:
 * - public.user_roles
 * - predicado canônico: ativo, não revogado e não expirado
 *
 * Fronteira de runtime:
 * - decisões de autorização passam por role-rpc/RoleRpcService;
 * - gestão administrativa, histórico e mutações pertencem ao domínio admin;
 * - components/pages não acessam user_roles nem AdminRolesService diretamente.
 */
import { logger } from '@/shared/utils/logger';
import { RoleRpcService } from './RoleRpcService';
import type { AppRole } from '../types/roles.types';

export class RoleService {
  /**
   * Verifica se um usuário possui um role específico.
   * Consulta via Edge Function `role-rpc`.
   */
  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    try {
      return RoleRpcService.hasRole(userId, role);
    } catch (error) {
      logger.error('Erro ao verificar role:', error);
      return false;
    }
  }

  /**
   * Verifica se um usuário é admin (admin ou super_admin).
   * Consulta via Edge Function `role-rpc`.
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      return RoleRpcService.isAdmin(userId);
    } catch (error) {
      logger.error('Erro ao verificar admin:', error);
      return false;
    }
  }

  /**
   * Verifica se um usuário é super admin.
   * Consulta via Edge Function `role-rpc`.
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      return RoleRpcService.isSuperAdmin(userId);
    } catch (error) {
      logger.error('Erro ao verificar super admin:', error);
      return false;
    }
  }

  /**
   * Retorna todos os roles globais atualmente válidos de um usuário.
   * Consulta via Edge Function `role-rpc`.
   */
  static async getUserRoles(userId: string): Promise<AppRole[]> {
    try {
      return RoleRpcService.getUserRoles(userId);
    } catch (error) {
      logger.error('Erro ao buscar roles do usuário:', error);
      return [];
    }
  }
}
