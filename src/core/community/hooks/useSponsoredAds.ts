import { useSponsoredAdsRuntime } from "@/core/community/services/SponsoredAdsRuntimeService";

export function useSponsoredAds() {
  return useSponsoredAdsRuntime("sidebar_widget");
}
