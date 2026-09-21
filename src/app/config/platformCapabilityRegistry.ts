import {
  isProductModuleEnabled,
  type ProductModuleKey,
} from "./productModuleRegistry";

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
 * Horizontal product infrastructure.
 *
 * These capabilities are not business domains. They can serve multiple
 * product modules and therefore have an independent lifecycle.
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
    status: "paused",
    dependsOnCapabilities: ["auth", "profiles"],
    dependsOnProductModules: ["business"],
  },
};

function isEnabled(
  capability: PlatformCapabilityKey,
  visiting: ReadonlySet<PlatformCapabilityKey>,
): boolean {
  if (visiting.has(capability)) return false;

  const config = PLATFORM_CAPABILITY_REGISTRY[capability];
  if (config.status !== "active") return false;

  const next = new Set(visiting);
  next.add(capability);

  const capabilityDependencies = config.dependsOnCapabilities ?? [];
  if (
    !capabilityDependencies.every((dependency) =>
      isEnabled(dependency, next),
    )
  ) {
    return false;
  }

  return (config.dependsOnProductModules ?? []).every(
    isProductModuleEnabled,
  );
}

export function isPlatformCapabilityEnabled(
  capability: PlatformCapabilityKey,
): boolean {
  return isEnabled(capability, new Set());
}

export function getActivePlatformCapabilities(): PlatformCapabilityKey[] {
  return (
    Object.keys(PLATFORM_CAPABILITY_REGISTRY) as PlatformCapabilityKey[]
  ).filter(isPlatformCapabilityEnabled);
}
