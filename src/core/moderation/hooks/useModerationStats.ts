import { useQuery } from "@tanstack/react-query";
import { moderationQueueService } from "@/core/moderation/services/ModerationQueueService";

export function useModerationStats() {
  return useQuery({
    queryKey: ["moderation-stats"],
    queryFn: () => moderationQueueService.getStats(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
