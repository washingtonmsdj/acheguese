import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import type {
  GastronomyActivationStatus,
  GastronomyProfileStatus,
} from "@/core/verticals/gastronomy/types";

export type { GastronomyActivationStatus };

export function useGastronomyStatus(businessId: string, isEligible: boolean) {
  const { data, isLoading } = useQuery({
    queryKey: ["gastronomy-status", businessId],
    queryFn: async (): Promise<GastronomyProfileStatus | null> => {
      const { data: profile, error } = await supabase
        .from("gastronomy_profiles")
        .select("id, business_id, status")
        .eq("business_id", businessId)
        .maybeSingle();

      if (error) throw error;
      return profile as GastronomyProfileStatus | null;
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

