import { useQuery } from "@tanstack/react-query";
import { FavoriteGroup } from "@/shared/types/community";
import { useSessionContext } from "@/core/session";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService";
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

      const groupIds = await SocialInteractionsService.getUserGroupIds(activeProfile.userId);
      if (groupIds.length === 0) return [];

      const groups = await CommunityService.getGroups(undefined, undefined);
      const byMembership = (groups as unknown as CommunityGroupListItem[])
        .filter((group) => groupIds.includes(group.id))
        .sort((a, b) => (b.members_count || 0) - (a.members_count || 0));

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
