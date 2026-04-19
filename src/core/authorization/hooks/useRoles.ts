/**
 * useRoles Hook
 * 
 * Hook React para verificação de roles e autorização.
 * 
 * REGRAS:
 * - Usar este hook em components/pages para verificar roles
 * - Nunca acessar user_roles diretamente
 * - Sempre usar RoleService internamente
 */
import { logger } from '@/shared/utils/logger';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/core/auth/hooks';
import { RoleService } from '../services/RoleService';
import type { AppRole, UserRole, RoleHistory } from '../types/roles.types';
// ============================================================================
// USE HAS ROLE
// ============================================================================

/**
 * Verifica se o usuário atual possui um role específico.
 * 
 * @example
 * const { hasRole, isLoading } = useHasRole('admin');
 * if (hasRole) {
 *   // Mostrar UI de admin
 * }
 */
export function useHasRole(role: AppRole) {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['role', 'has', userId, role],
    queryFn: () => {
      if (!userId) return false;
      return RoleService.hasRole(userId, role);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos
  });
}

// ============================================================================
// USE IS ADMIN
// ============================================================================

/**
 * Verifica se o usuário atual é admin (admin ou super_admin).
 * 
 * @example
 * const { isAdmin, isLoading } = useIsAdmin();
 * if (isAdmin) {
 *   // Mostrar painel de admin
 * }
 */
export function useIsAdmin() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['role', 'isAdmin', userId],
    queryFn: () => {
      if (!userId) return false;
      return RoleService.isAdmin(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

// ============================================================================
// USE IS SUPER ADMIN
// ============================================================================

/**
 * Verifica se o usuário atual é super admin.
 * 
 * @example
 * const { isSuperAdmin, isLoading } = useIsSuperAdmin();
 * if (isSuperAdmin) {
 *   // Mostrar configurações de sistema
 * }
 */
export function useIsSuperAdmin() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['role', 'isSuperAdmin', userId],
    queryFn: () => {
      if (!userId) return false;
      return RoleService.isSuperAdmin(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

// ============================================================================
// USE USER ROLES
// ============================================================================

/**
 * Retorna todos os roles ativos do usuário atual.
 * 
 * @example
 * const { roles, isLoading } = useUserRoles();
 * logger.debug(roles); // ['user', 'business_owner']
 */
export function useUserRoles() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['role', 'list', userId],
    queryFn: () => {
      if (!userId) return [];
      return RoleService.getUserRoles(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

// ============================================================================
// USE USER ROLE DETAILS
// ============================================================================

/**
 * Retorna os detalhes completos dos roles do usuário atual.
 * 
 * Inclui metadados, datas de concessão, etc.
 * 
 * @example
 * const { roleDetails, isLoading } = useUserRoleDetails();
 */
export function useUserRoleDetails() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<UserRole[]>({
    queryKey: ['role', 'details', userId],
    queryFn: () => {
      if (!userId) return [];
      return RoleService.getUserRoleDetails(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

// ============================================================================
// USE ROLE HISTORY
// ============================================================================

/**
 * Retorna o histórico de roles do usuário atual.
 * 
 * @example
 * const { history, isLoading } = useRoleHistory();
 */
export function useRoleHistory() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<RoleHistory[]>({
    queryKey: ['role', 'history', userId],
    queryFn: () => {
      if (!userId) return [];
      return RoleService.getRoleHistory(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

// ============================================================================
// USE CHECK MULTIPLE ROLES
// ============================================================================

/**
 * Verifica múltiplos roles de uma vez.
 * 
 * Útil para verificações complexas de UI.
 * 
 * @example
 * const { roleChecks, isLoading } = useCheckMultipleRoles(['admin', 'moderator']);
 * if (roleChecks?.admin || roleChecks?.moderator) {
 *   // Mostrar UI de moderação
 * }
 */
export function useCheckMultipleRoles(roles: AppRole[]) {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['role', 'checkMultiple', userId, ...roles],
    queryFn: () => {
      if (!userId) return {};
      return RoleService.checkMultipleRoles(userId, roles);
    },
    enabled: !!userId && roles.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

// ============================================================================
// USE USERS BY ROLE (ADMIN ONLY)
// ============================================================================

/**
 * Lista todos os usuários com um role específico.
 * 
 * REQUER: admin role.
 * 
 * @example
 * const { users, isLoading } = useUsersByRole('moderator');
 */
export function useUsersByRole(role: AppRole) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery<UserRole[]>({
    queryKey: ['role', 'usersByRole', role],
    queryFn: () => RoleService.getUsersByRole(role),
    enabled: isAdmin === true,
    staleTime: 2 * 60 * 1000, // 2 minutos (dados admin mudam mais)
    gcTime: 5 * 60 * 1000
  });
}

// ============================================================================
// USE COUNT USERS BY ROLE (ADMIN ONLY)
// ============================================================================

/**
 * Conta quantos usuários têm um role específico.
 * 
 * REQUER: admin role.
 * 
 * @example
 * const { count, isLoading } = useCountUsersByRole('driver');
 */
export function useCountUsersByRole(role: AppRole) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['role', 'countByRole', role],
    queryFn: () => RoleService.countUsersByRole(role),
    enabled: isAdmin === true,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  });
}
