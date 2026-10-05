import {
  getNearbyProvider,
  NEARBY_PROVIDER_ORDER,
  type NearbyProviderId,
} from "@/core/nearby/providers/registry";
import { ModuleKey } from "@/core/rollout/types";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

const PROVIDER_PRODUCT_MODULE: Record<NearbyProviderId, ProductModuleKey> = {
  business: "business",
};

const PROVIDER_ROLLOUT_MODULE: Record<NearbyProviderId, ModuleKey> = {
  business: ModuleKey.BUSINESS,
};

function getProviderProductModule(providerId: NearbyProviderId): ProductModuleKey {
  switch (providerId) {
    case "business":
      return PROVIDER_PRODUCT_MODULE.business;
  }
}

function getProviderRolloutModule(providerId: NearbyProviderId): ModuleKey {
  switch (providerId) {
    case "business":
      return PROVIDER_ROLLOUT_MODULE.business;
  }
}

export function getActiveNearbyProviderIds(): NearbyProviderId[] {
  if (!isPlatformCapabilityEnabled("nearby")) return [];

  return NEARBY_PROVIDER_ORDER.filter((providerId) => {
    const productModule = getProviderProductModule(providerId);
    return (
      isProductModuleEnabled(productModule) &&
      getNearbyProvider(providerId) !== null
    );
  });
}

export function getActiveNearbyProviderRolloutModuleKeys(): ModuleKey[] {
  return [
    ...new Set(
      getActiveNearbyProviderIds().map(getProviderRolloutModule),
    ),
  ];
}
