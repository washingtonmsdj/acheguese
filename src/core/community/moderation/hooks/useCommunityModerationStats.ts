import { useQuery } from "@tanstack/react-query";
import { communityContentModerationService } from "../CommunityContentModerationService";

export function useCommunityModerationStats() {
  return useQuery({
    queryKey: ["moderation-stats"],
    queryFn: () => communityContentModerationService.getStats(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
