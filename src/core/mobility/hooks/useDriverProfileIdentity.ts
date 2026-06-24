import { useQuery } from "@tanstack/react-query";
import { useIsAdmin } from "@/core/auth/hooks/useIsAdmin";
import { useSessionContext } from "@/core/session";
import type { DriverDataRecord } from "@/core/mobility/types/DriverDataRecord";

interface UseDriverProfileIdentityOptions {
  allowAdminBootstrap?: boolean;
  enabled?: boolean;
  queryKey?: readonly unknown[];
  queryScope?: string;
}

export function useDriverProfileIdentity({
  allowAdminBootstrap = false,
  enabled = true,
  queryKey,
  queryScope = "default",
}: UseDriverProfileIdentityOptions) {
  const { user, profiles } = useSessionContext();
  const { isAdmin } = useIsAdmin();

  const sessionDriverProfile = profiles.find(
    (profile) => profile.profileType === "driver",
  );

  const resolvedQueryKey =
    queryKey ?? ["driver-profile-identity", queryScope, user?.id ?? null];

  const query = useQuery({
    queryKey: resolvedQueryKey,
    queryFn: async (): Promise<DriverDataRecord | null> => {
      if (!user) {
        return null;
      }

      const { mobilityService } = await import("@/core/mobility/services/runtime");
      const existing = (await mobilityService.getDriverData(user.id)) as DriverDataRecord | null;
      if (existing || !allowAdminBootstrap || !isAdmin) {
        return existing;
      }

      return (await mobilityService.createAdminDriverProfile(user.id)) as DriverDataRecord | null;
    },
    enabled: enabled && !!user,
    retry: false,
  });

  const driverProfileId = query.data?.profile_id ?? sessionDriverProfile?.id ?? null;

  return {
    user,
    driverData: query.data,
    driverProfileId,
    sessionDriverProfile,
    isRegistered: Boolean(driverProfileId),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
