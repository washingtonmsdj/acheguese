import { useOutletContext } from "react-router-dom";
import type { Business } from "@/core/business/types/Business";
import type { PlanTier, PlanEntitlements } from "@/core/billing/types";

export interface BusinessDashboardContextValue {
  businessId: string;
  business: Business;
  planTier: PlanTier;
  entitlements: PlanEntitlements;
  isGastronomyEligible: boolean;
  isGastronomyActive: boolean;
  publicUrl: string | null;
  premiumUrl: string | null;
}

export function useBusinessDashboardContext() {
  return useOutletContext<BusinessDashboardContextValue>();
}

