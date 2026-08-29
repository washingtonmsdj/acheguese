import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { RoleService } from "@/core/authorization/services/RoleService";

/**
 * Retorna true se o usuário autenticado tem role admin ou moderator ativo.
 * Usado para bypassar restrições de UI que não se aplicam a admins.
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: () => RoleService.getUserRoles(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = (roles ?? []).some((role) =>
    ["admin", "moderator"].includes(role),
  );

  return { isAdmin, loading: isLoading };
}
