import type {
  TerritoryNavigationMode,
  TerritoryNavigationModeId,
} from "@/core/navigation/territoryNavigationModes";

import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";

const MODE_ENABLED_CHECKS: Record<
  TerritoryNavigationModeId,
  () => boolean
> = {
  home: () => isPlatformCapabilityEnabled("territory"),
  map: () => isPlatformCapabilityEnabled("map"),
  business: () => isProductModuleEnabled("business"),
  nearby: () => isPlatformCapabilityEnabled("nearby"),
  search: () => isPlatformCapabilityEnabled("search"),
  account: () => isPlatformCapabilityEnabled("account"),
};

export function isTerritoryNavigationModeEnabled(
  modeId: TerritoryNavigationModeId,
): boolean {
  return MODE_ENABLED_CHECKS[modeId]();
}

export function getActiveTerritoryNavigationModeIds(): TerritoryNavigationModeId[] {
  return (Object.keys(MODE_ENABLED_CHECKS) as TerritoryNavigationModeId[]).filter(
    isTerritoryNavigationModeEnabled,
  );
}

export function filterActiveTerritoryNavigationModes<
  TMode extends TerritoryNavigationMode,
>(modes: readonly TMode[]): TMode[] {
  return modes.filter((mode) => isTerritoryNavigationModeEnabled(mode.id));
}
