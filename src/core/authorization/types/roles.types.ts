/**
 * Role System Types
 * 
 * SSOT para o sistema de roles e autorização baseada em roles.
 * 
 * Alinhado com: supabase/migrations/20260418000000_create_roles_system.sql
 */

// ============================================================================
// APP ROLE
// ============================================================================

/**
 * Roles disponíveis no sistema.
 * 
 * DEVE estar sincronizado com o enum `app_role` no banco de dados.
 * 
 * - super_admin: Acesso total ao sistema
 * - admin: Administração geral
 * - moderator: Moderação de conteúdo
 * - business_owner: Proprietário de negócio
 * - driver: Motorista (mobility)
 * - user: Usuário padrão
 */
export type AppRole = 
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'business_owner'
  | 'driver'
  | 'user';

// ============================================================================
// USER ROLE
// ============================================================================

/**
 * Representa um role atribuído a um usuário.
 * 
 * Alinhado com a tabela `user_roles` no banco.
 */
export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ROLE HISTORY
// ============================================================================

/**
 * Representa uma entrada no histórico de roles.
 * 
 * Alinhado com a tabela `role_history` no banco.
 */
export interface RoleHistory {
  id: string;
  user_id: string;
  role: AppRole;
  action: 'granted' | 'revoked';
  performed_by: string | null;
  performed_at: string;
  reason: string | null;
  metadata: Record<string, unknown>;
}

// ============================================================================
// ROLE GRANT REQUEST
// ============================================================================

/**
 * Request para conceder um role a um usuário.
 */
export interface GrantRoleRequest {
  user_id: string;
  role: AppRole;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ROLE REVOKE REQUEST
// ============================================================================

/**
 * Request para revogar um role de um usuário.
 */
export interface RevokeRoleRequest {
  user_id: string;
  role: AppRole;
  reason?: string;
}

// ============================================================================
// ROLE CHECK RESULT
// ============================================================================

/**
 * Resultado de uma verificação de role.
 */
export interface RoleCheckResult {
  hasRole: boolean;
  role?: AppRole;
  grantedAt?: string;
}

// ============================================================================
// ROLE HELPERS
// ============================================================================

/**
 * Verifica se um role é administrativo.
 */
export function isAdminRole(role: AppRole): boolean {
  return role === 'super_admin' || role === 'admin';
}

/**
 * Verifica se um role é super admin.
 */
export function isSuperAdminRole(role: AppRole): boolean {
  return role === 'super_admin';
}

/**
 * Verifica se um role é moderador.
 */
export function isModeratorRole(role: AppRole): boolean {
  return role === 'moderator' || isAdminRole(role);
}

/**
 * Retorna a hierarquia de roles (maior para menor privilégio).
 */
export function getRoleHierarchy(): AppRole[] {
  return [
    'super_admin',
    'admin',
    'moderator',
    'business_owner',
    'driver',
    'user'
  ];
}

/**
 * Compara dois roles e retorna se o primeiro tem mais privilégios.
 */
export function hasHigherPrivilege(role1: AppRole, role2: AppRole): boolean {
  const hierarchy = getRoleHierarchy();
  const index1 = hierarchy.indexOf(role1);
  const index2 = hierarchy.indexOf(role2);
  
  return index1 < index2;
}

/**
 * Retorna o label amigável de um role.
 */
export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    moderator: 'Moderador',
    business_owner: 'Proprietário de Negócio',
    driver: 'Motorista',
    user: 'Usuário'
  };
  
  return labels[role];
}

/**
 * Retorna a descrição de um role.
 */
export function getRoleDescription(role: AppRole): string {
  const descriptions: Record<AppRole, string> = {
    super_admin: 'Acesso total ao sistema, incluindo gerenciamento de outros admins',
    admin: 'Administração geral do sistema e moderação',
    moderator: 'Moderação de conteúdo e usuários',
    business_owner: 'Gerenciamento de negócios cadastrados',
    driver: 'Acesso a funcionalidades de motorista',
    user: 'Usuário padrão do sistema'
  };
  
  return descriptions[role];
}
