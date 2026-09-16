import { useQuery } from "@tanstack/react-query";
import { getActiveRide } from "@/core/mobility/services/mobility.queries";
import { useAuth } from "@/core/auth";
import { MOBILITY_QUERY_KEYS } from "@/core/mobility/constants";
import type { RideRequest } from "../types/types";

export function useActiveRide() {
  const { user } = useAuth();

  const { data: activeRide, isLoading } = useQuery<RideRequest | null>({
    queryKey: MOBILITY_QUERY_KEYS.activeRide(user?.id || ""),
    queryFn: async () => {
      if (!user) return null;
      const activeProfileId = user.id;
      return getActiveRide(activeProfileId);
    },
    enabled: !!user,
  });

  return { activeRide, isLoading, hasActiveRide: Boolean(activeRide) };
}
