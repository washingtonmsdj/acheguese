import {
  isProductModuleEnabled,
  isPlatformCapabilityEnabled,
} from "./lifecycleRegistry";
import { businessManagementNavigation } from "@/modules/business/dashboard/businessManagementNavigation";

/** Only certified Business management surfaces enter the active Central shell. */
export function getActiveBusinessManagementNavigation() {
  if (!isPlatformCapabilityEnabled("central")) return [];
  return businessManagementNavigation
    .filter((item) => isProductModuleEnabled(item.owner))
    .sort((a, b) => a.order - b.order);
}
