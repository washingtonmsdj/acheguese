import { useQuery } from "@tanstack/react-query";
import { FavoriteGroup } from "@/shared/types/community";
import { useSessionContext } from "@/core/session";
import { CommunityService } from "@/core/community/services/CommunityService";

interface CommunityGroupListItem {
  id: string;
  name?: string | null;
  members_count?: number | null;
  avatar_url?: string | null;
}

/**
 * Hook for search grupos do usuario.
 */
export function useFavoriteGroups() {
  const { user, activeProfile } = useSessionContext();

  return useQuery({
    queryKey: ["favorite-groups", activeProfile?.id],
    queryFn: async (): Promise<FavoriteGroup[]> => {
      if (!activeProfile?.userId) return [];

      const page = await CommunityService.getGroupsPage({
        limit: 50,
        onlyMemberGroups: true,
        sortBy: "populares",
      });
      const byMembership = page.items as unknown as CommunityGroupListItem[];

      return byMembership.map((group) => ({
        id: group.id,
        name: group.name || "Grupo",
        members: String(group.members_count || 0),
        icon: group.avatar_url || "??",
      }));
    },
    enabled: !!user && !!activeProfile?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
