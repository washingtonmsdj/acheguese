import {
  getNearbyProvider,
  NEARBY_PROVIDER_ORDER,
  type NearbyProviderId,
} from "@/core/nearby/providers/registry";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

const PROVIDER_PRODUCT_MODULE: Record<NearbyProviderId, ProductModuleKey> = {
  business: "business",
};

export function getActiveNearbyProviderIds(): NearbyProviderId[] {
  if (!isPlatformCapabilityEnabled("nearby")) return [];

  return NEARBY_PROVIDER_ORDER.filter((providerId) => {
    const productModule = PROVIDER_PRODUCT_MODULE[providerId];
    return (
      isProductModuleEnabled(productModule) &&
      getNearbyProvider(providerId) !== null
    );
  });
}
