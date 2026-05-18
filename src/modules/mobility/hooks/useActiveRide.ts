import { useQuery } from "@tanstack/react-query";
import { MobilityFacade } from "@/modules/mobility/services/MobilityService";
import { useAuth } from "@/core/auth";
import { RIDE_STATUS, MOBILITY_QUERY_KEYS } from "../constants";
import type { RideRequest } from "../types/types";

export function useActiveRide() {
  const { user } = useAuth();

  const { data: activeRide, isLoading } = useQuery<RideRequest | null>({
    queryKey: MOBILITY_QUERY_KEYS.activeRide(user?.id || ""),
    queryFn: async () => {
      if (!user) return null;
      const rides = (await MobilityFacade.getUserRides(user.id)) as RideRequest[];
      const activeStatuses: RideRequest["status"][] = [
        RIDE_STATUS.PENDING,
        RIDE_STATUS.DRIVER_ACCEPTED,
        RIDE_STATUS.IN_PROGRESS,
      ];
      const active = rides.find((r) => activeStatuses.includes(r.status));
      return active || null;
    },
    enabled: !!user,
  });

  return { activeRide, isLoading, hasActiveRide: !!activeRide };
}
