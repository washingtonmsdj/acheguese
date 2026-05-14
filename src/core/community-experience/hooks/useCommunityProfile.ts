import { useQuery } from "@tanstack/react-query";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";

export function useCommunityProfile(resolved: ResolvedTerritory | null) {
  return useQuery({
    queryKey: ["community-profile", resolved?.kind, resolved?.kind === "group" ? resolved.group.id : resolved?.location.id],
    queryFn: async () => {
      if (!resolved) {
        throw new Error("resolved territory is required");
      }
      return CommunityExperienceService.getCommunityProfile(resolved);
    },
    enabled: Boolean(resolved),
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
