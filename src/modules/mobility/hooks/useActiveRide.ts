import { useQuery } from "@tanstack/react-query";
import { MobilityFacade } from "@/core/mobility/services/MobilityService";
import { isOpenRideStatus } from "@/core/mobility/core/RideLifecycleStatus";
import { useAuth } from "@/core/auth";
import { MOBILITY_QUERY_KEYS } from "@/core/mobility/constants";
import type { RideRequest } from "../types/types";

export function useActiveRide() {
  const { user } = useAuth();

  const { data: activeRide, isLoading } = useQuery<RideRequest | null>({
    queryKey: MOBILITY_QUERY_KEYS.activeRide(user?.id || ""),
    queryFn: async () => {
      if (!user) return null;
      const rides = (await MobilityFacade.getUserRides(user.id)) as RideRequest[];
      return rides.find((ride) => isOpenRideStatus(ride.status)) ?? null;
    },
    enabled: !!user,
  });

  return { activeRide, isLoading, hasActiveRide: Boolean(activeRide) };
}
