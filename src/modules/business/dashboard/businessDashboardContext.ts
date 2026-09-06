import { useOutletContext } from "react-router-dom";
import type { Business } from "@/core/business/types/Business";
import type { PlanTier, PlanEntitlements } from "@/core/billing/types";

export interface BusinessDashboardContextValue {
  /** Profile ID usado pela rota administrativa e pela autoridade multi-profile. */
  businessId: string;
  /** business_data.id usado por extensoes como Billing, Gastronomia e Coverage. */
  businessDataId: string;
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

export function useOptionalBusinessDashboardContext() {
  return useOutletContext<BusinessDashboardContextValue | null>();
}

