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
import { RoleRpcService } from './RoleRpcService';
import type { AppRole } from '../types/roles.types';

export class RoleService {
  /**
   * Verifica se um usuário possui um role específico.
   * Consulta via Edge Function `role-rpc`.
   */
  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    return RoleRpcService.hasRole(userId, role);
  }

  /**
   * Verifica se um usuário é admin (admin ou super_admin).
   * Consulta via Edge Function `role-rpc`.
   */
  static async isAdmin(userId: string): Promise<boolean> {
    return RoleRpcService.isAdmin(userId);
  }

  /**
   * Verifica se um usuário é super admin.
   * Consulta via Edge Function `role-rpc`.
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    return RoleRpcService.isSuperAdmin(userId);
  }

  /**
   * Retorna todos os roles globais atualmente válidos de um usuário.
   * Consulta via Edge Function `role-rpc`.
   */
  static async getUserRoles(userId: string): Promise<AppRole[]> {
    // O broker é o owner de leitura: indisponibilidade não é ausência de roles.
    return RoleRpcService.getUserRoles(userId);
  }
}
