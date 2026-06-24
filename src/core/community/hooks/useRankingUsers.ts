import { useQuery } from "@tanstack/react-query";
import { RankingUser } from "@/shared/types/community";
import { CommunityService } from "@/core/community/services/CommunityService";
import { COMMUNITY_LEADERBOARD_ENABLED } from "@/core/community/config/communityConfig";

/**
 * Hook for search ranking de vizinhos via SSOT.
 */
export function useRankingUsers(limit: number = 3, enabled: boolean = true) {
  return useQuery({
    queryKey: ["ranking-users", limit],
    enabled: enabled && COMMUNITY_LEADERBOARD_ENABLED,
    queryFn: async (): Promise<RankingUser[]> => {
      const leaderboard = await CommunityService.getLeaderboard(limit);
      return leaderboard.map((user, index) => ({
        id: user.id,
        name: user.display_name || "Usuário",
        points: user.total_points || 0,
        position: index + 1,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
