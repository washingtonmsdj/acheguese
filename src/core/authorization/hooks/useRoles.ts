import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/core/auth/hooks";
import { getCacheConfig } from "@/core/session/cache/CacheConfig";
import { RoleService } from "../services/RoleService";
import type { AppRole, RoleHistory, UserRole } from "../types/roles.types";

const cacheConfig = getCacheConfig();
const ROLE_STALE_TIME = cacheConfig.authorization.ttl;
const ROLE_GC_TIME = cacheConfig.session.ttl;

export function useHasRole(role: AppRole) {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["role", "has", userId, role],
    queryFn: () => {
      if (!userId) return false;
      return RoleService.hasRole(userId, role);
    },
    enabled: !!userId,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useIsAdmin() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["role", "isAdmin", userId],
    queryFn: () => {
      if (!userId) return false;
      return RoleService.isAdmin(userId);
    },
    enabled: !!userId,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useIsSuperAdmin() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["role", "isSuperAdmin", userId],
    queryFn: () => {
      if (!userId) return false;
      return RoleService.isSuperAdmin(userId);
    },
    enabled: !!userId,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useUserRoles() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["role", "list", userId],
    queryFn: () => {
      if (!userId) return [];
      return RoleService.getUserRoles(userId);
    },
    enabled: !!userId,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useUserRoleDetails() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<UserRole[]>({
    queryKey: ["role", "details", userId],
    queryFn: () => {
      if (!userId) return [];
      return RoleService.getUserRoleDetails(userId);
    },
    enabled: !!userId,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useRoleHistory() {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery<RoleHistory[]>({
    queryKey: ["role", "history", userId],
    queryFn: () => {
      if (!userId) return [];
      return RoleService.getRoleHistory(userId);
    },
    enabled: !!userId,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useCheckMultipleRoles(roles: AppRole[]) {
  const { session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["role", "checkMultiple", userId, ...roles],
    queryFn: () => {
      if (!userId) return {};
      return RoleService.checkMultipleRoles(userId, roles);
    },
    enabled: !!userId && roles.length > 0,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useUsersByRole(role: AppRole) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery<UserRole[]>({
    queryKey: ["role", "usersByRole", role],
    queryFn: () => RoleService.getUsersByRole(role),
    enabled: isAdmin === true,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}

export function useCountUsersByRole(role: AppRole) {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["role", "countByRole", role],
    queryFn: () => RoleService.countUsersByRole(role),
    enabled: isAdmin === true,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}
