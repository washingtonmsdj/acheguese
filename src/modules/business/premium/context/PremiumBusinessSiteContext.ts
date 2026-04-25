import { useOutletContext } from "react-router-dom";
import type {
  PublicBusinessSnapshot,
  PublicGastronomySnapshot,
} from "@/modules/business/public/types";
import type { PremiumBusinessSiteRoutes } from "@/core/business/services/PremiumBusinessSiteResolver";

export interface PremiumBusinessSiteContextValue {
  readonly premiumSlug: string;
  readonly routes: PremiumBusinessSiteRoutes;
  readonly businessSnapshot: PublicBusinessSnapshot;
  readonly gastronomySnapshot: PublicGastronomySnapshot | null;
  readonly hasGastronomy: boolean;
}

export function usePremiumBusinessSiteContext() {
  return useOutletContext<PremiumBusinessSiteContextValue>();
}

