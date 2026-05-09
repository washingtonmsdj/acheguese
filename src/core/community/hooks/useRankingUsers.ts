import { useQuery } from "@tanstack/react-query";
import { RankingUser } from "@/shared/types/community";
import { CommunityService } from "@/core/community/services/CommunityService";

/**
 * Hook for search ranking de vizinhos via SSOT.
 */
export function useRankingUsers(limit: number = 3) {
  return useQuery({
    queryKey: ["ranking-users", limit],
    queryFn: async (): Promise<RankingUser[]> => {
      const leaderboard = await CommunityService.getLeaderboard(limit);
      return leaderboard.map((user, index) => ({
        id: user.id,
        name: user.display_name || "Usuario",
        points: user.total_points || 0,
        position: index + 1,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
