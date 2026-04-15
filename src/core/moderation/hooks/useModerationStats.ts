import { useQuery } from "@tanstack/react-query";
import { ModerationStats } from "@/core/moderation/types";
export function useModerationStats() {
  return useQuery({
    queryKey: ["moderation-stats"],
    queryFn: async (): Promise<ModerationStats> => {
      return {
        pending_reports: { posts: 0, comments: 0, total: 0 },
        resolved_reports: { approved: 0, rejected: 0, total: 0 },
        content_actions: { hidden: 0, removed: 0, total: 0 },
      };
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
