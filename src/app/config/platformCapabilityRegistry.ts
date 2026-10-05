import type { ProductModuleKey } from "./productModuleRegistry";

export type PlatformCapabilityStatus = "active" | "paused";

export type PlatformCapabilityKey =
  | "auth"
  | "account"
  | "profiles"
  | "territory"
  | "location"
  | "notifications"
  | "central"
  | "map"
  | "nearby"
  | "search"
  | "messaging";

export interface PlatformCapabilityLifecycle {
  status: PlatformCapabilityStatus;
  dependsOnCapabilities?: readonly PlatformCapabilityKey[];
  dependsOnProductModules?: readonly ProductModuleKey[];
}

/**
 * Horizontal platform capabilities.
 *
 * A capability may receive providers/events from product modules, but it must
 * not depend on one vertical merely because that vertical is the first active
 * provider. Pausing Business, Community or any future module must therefore
 * not disable Messaging or Notifications at platform level.
 */
export const PLATFORM_CAPABILITY_REGISTRY: Record<
  PlatformCapabilityKey,
  PlatformCapabilityLifecycle
> = {
  auth: { status: "active" },
  profiles: { status: "active", dependsOnCapabilities: ["auth"] },
  account: { status: "active", dependsOnCapabilities: ["profiles"] },
  territory: { status: "active" },
  location: { status: "active" },
  notifications: {
    status: "active",
    dependsOnCapabilities: ["auth"],
  },
  central: {
    status: "active",
    dependsOnCapabilities: ["auth", "profiles"],
  },
  map: {
    status: "active",
    dependsOnCapabilities: ["territory"],
  },
  nearby: {
    status: "active",
    dependsOnCapabilities: ["map", "location"],
  },
  search: {
    status: "active",
    dependsOnCapabilities: ["territory"],
  },
  messaging: {
    status: "active",
    dependsOnCapabilities: ["auth", "profiles"],
  },
};
