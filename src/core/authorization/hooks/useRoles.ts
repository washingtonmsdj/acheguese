import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { getCacheConfig } from "@/core/session/cache/CacheConfig";
import { RoleService } from "../services/RoleService";
import type { AppRole } from "../types/roles.types";

const cacheConfig = getCacheConfig();
const ROLE_STALE_TIME = cacheConfig.authorization.ttl;
const ROLE_GC_TIME = cacheConfig.session.ttl;

function useCurrentUserId(): string | undefined {
  return useSessionContext().user?.id;
}

export function useHasRole(role: AppRole) {
  const userId = useCurrentUserId();

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
  const userId = useCurrentUserId();

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
  const userId = useCurrentUserId();

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
  const userId = useCurrentUserId();

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

export function useCheckMultipleRoles(roles: AppRole[]) {
  const userId = useCurrentUserId();

  return useQuery<Partial<Record<AppRole, boolean>>>({
    queryKey: ["role", "checkMultiple", userId, ...roles],
    queryFn: async () => {
      if (!userId) return {};

      const entries = await Promise.all(
        roles.map(async (role) => [role, await RoleService.hasRole(userId, role)] as const),
      );

      return Object.fromEntries(entries) as Partial<Record<AppRole, boolean>>;
    },
    enabled: !!userId && roles.length > 0,
    staleTime: ROLE_STALE_TIME,
    gcTime: ROLE_GC_TIME,
  });
}
