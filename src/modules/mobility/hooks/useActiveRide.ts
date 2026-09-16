import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import { MOBILITY_QUERY_KEYS } from "@/core/mobility/constants";
import { getActiveRide } from "@/core/mobility/services/mobility.queries";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { RideRequest } from "../types/types";

export function useActiveRide() {
  const { user } = useAuth();

  const { data: activeRide, isLoading } = useQuery<RideRequest | null>({
    queryKey: MOBILITY_QUERY_KEYS.activeRide(user?.id || ""),
    queryFn: async () => {
      if (!user) return null;
      const activeProfile = await profileService.getActiveProfile(user.id);
      if (!activeProfile?.id) return null;
      return getActiveRide(activeProfile.id);
    },
    enabled: !!user,
  });

  return { activeRide, isLoading, hasActiveRide: Boolean(activeRide) };
}
