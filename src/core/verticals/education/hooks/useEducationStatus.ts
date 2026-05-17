import { useQuery } from "@tanstack/react-query";
import { useEducationProfile } from "@/core/education/hooks/useEducationProfile";
import type { EducationProfileStatus } from "@/core/education/types";

export type EducationActivationStatus = "not_eligible" | "not_configured" | EducationProfileStatus;

export interface EducationStatusResult {
  status: EducationActivationStatus;
  profile: EducationProfile | null;
  isLoading: boolean;
}

export function useEducationStatus(businessId: string, isEligible: boolean): EducationStatusResult {
  const { data: profile, isLoading } = useEducationProfile(businessId);

  if (!isEligible) {
    return { status: "not_eligible", profile: null, isLoading: false };
  }

  if (isLoading) {
    return { status: "not_configured", profile: null, isLoading: true };
  }

  if (!profile) {
    return { status: "not_configured", profile: null, isLoading: false };
  }

  return {
    status: profile.status as EducationActivationStatus,
    profile,
    isLoading: false,
  };
}
