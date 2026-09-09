import { useQuery } from "@tanstack/react-query";
import { getMobilityConversations } from "@/core/mobility/services/mobility.queries";
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/core/mobility/constants";

export function useMobilityConversations(
  profileId: string | null | undefined,
) {
  return useQuery({
    queryKey: MOBILITY_QUERY_KEYS.mobilityConversations(profileId!),
    queryFn: () => getMobilityConversations(),
    enabled: !!profileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });
}
