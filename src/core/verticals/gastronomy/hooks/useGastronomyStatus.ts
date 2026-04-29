import { useQuery } from "@tanstack/react-query";
import { getGastronomyProfile } from "@/core/business/services/gastronomy.queries";
import type {
  GastronomyActivationStatus,
  GastronomyProfileStatus,
} from "@/core/verticals/gastronomy/types";

export type { GastronomyActivationStatus };

export function useGastronomyStatus(businessId: string, isEligible: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ["gastronomy-status", businessId],
    queryFn: async (): Promise<GastronomyProfileStatus | null> => {
      const profile = await getGastronomyProfile(businessId);
      if (!profile) return null;
      return {
        id: profile.id,
        business_id: profile.business_id,
        status: profile.status,
      };
    },
    enabled: !!businessId && isEligible,
  });

  if (!isEligible) {
    return { status: "not_eligible" as GastronomyActivationStatus, profile: null, isLoading: false };
  }

  if (isLoading) {
    return { status: "not_configured" as GastronomyActivationStatus, profile: null, isLoading: true };
  }

  if (!data) {
    return { status: "not_configured" as GastronomyActivationStatus, profile: null, isLoading: false };
  }

  return {
    status: data.status as GastronomyActivationStatus,
    profile: data,
    isLoading: false,
  };
}
