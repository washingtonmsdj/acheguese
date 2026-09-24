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
 * Horizontal capabilities that can serve multiple product modules.
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
  notifications: { status: "active", dependsOnCapabilities: ["auth"] },
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
    dependsOnProductModules: ["business"],
  },
  search: {
    status: "active",
    dependsOnCapabilities: ["territory"],
  },
  messaging: {
    status: "active",
    dependsOnCapabilities: ["auth", "profiles"],
    dependsOnProductModules: ["business"],
  },
};
