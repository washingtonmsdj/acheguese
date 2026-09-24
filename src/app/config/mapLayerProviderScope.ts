import {
  getMapLayerProviderDefinition,
  MAP_LAYER_PROVIDER_ORDER,
} from "@/core/maps/providers/registry";
import type { MapLayerProviderId } from "@/core/maps/providers/types";
import type { MapLayerKey } from "@/core/maps/types/core";
import { ModuleKey } from "@/core/rollout/types";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

const PROVIDER_PRODUCT_MODULE: Record<
  MapLayerProviderId,
  ProductModuleKey
> = {
  business: "business",
};

const PROVIDER_ROLLOUT_MODULE: Record<MapLayerProviderId, ModuleKey> = {
  business: ModuleKey.BUSINESS,
};

export function getActiveMapLayerProviderIds(): MapLayerProviderId[] {
  if (!isPlatformCapabilityEnabled("map")) return [];

  return MAP_LAYER_PROVIDER_ORDER.filter((providerId) => {
    const productModule = PROVIDER_PRODUCT_MODULE[providerId];
    return (
      isProductModuleEnabled(productModule) &&
      getMapLayerProviderDefinition(providerId) !== null
    );
  });
}

export function getActiveMapLayerKeys(): MapLayerKey[] {
  return getActiveMapLayerProviderIds().flatMap((providerId) => {
    const definition = getMapLayerProviderDefinition(providerId);
    return definition ? [definition.layerKey] : [];
  });
}

export function getActiveMapLayerRolloutModuleKeys(): ModuleKey[] {
  return [
    ...new Set(
      getActiveMapLayerProviderIds().map(
        (providerId) => PROVIDER_ROLLOUT_MODULE[providerId],
      ),
    ),
  ];
}
