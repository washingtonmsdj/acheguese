import { useQuery } from "@tanstack/react-query";
import {
  communityRpcOperationsService,
  type CommunityRpcObservabilityWindow,
} from "@/core/admin/services/CommunityRpcOperationsService";

export function useCommunityRpcOperations(windowMinutes: CommunityRpcObservabilityWindow) {
  return useQuery({
    queryKey: ["admin", "community-rpc-operations", windowMinutes],
    queryFn: () => communityRpcOperationsService.getSnapshot(windowMinutes),
    staleTime: 20 * 1000,
    refetchInterval: 60 * 1000,
  });
}
