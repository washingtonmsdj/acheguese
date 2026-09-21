import type { PlatformCapabilityKey } from "./platformCapabilityRegistry";

export type ProductModuleStatus = "active" | "paused";

export type ProductModuleKey =
  | "business"
  | "community"
  | "gastronomy"
  | "services"
  | "classifieds"
  | "touristPoints"
  | "education"
  | "jobs"
  | "events"
  | "communication"
  | "mobility"
  | "coupons"
  | "gamification"
  | "communityAlerts"
  | "communityIssues"
  | "communityLostFound"
  | "communityCommunication"
  | "familySafety"
  | "billing"
  | "publicAnalytics";

export interface ProductModuleLifecycle {
  status: ProductModuleStatus;
  dependsOnProductModules?: readonly ProductModuleKey[];
  dependsOnCapabilities?: readonly PlatformCapabilityKey[];
}

/**
 * Domain/product modules only.
 *
 * Horizontal capabilities (Search, Messaging, Map, Nearby, Auth, Profile,
 * Territory, Location, Notifications and Central) live in
 * platformCapabilityRegistry.ts.
 */
export const PRODUCT_MODULE_REGISTRY: Record<
  ProductModuleKey,
  ProductModuleLifecycle
> = {
  business: { status: "active" },

  community: { status: "paused" },
  gastronomy: {
    status: "paused",
    dependsOnProductModules: ["business"],
  },
  services: { status: "paused" },
  classifieds: { status: "paused" },
  touristPoints: {
    status: "paused",
    dependsOnCapabilities: ["map"],
  },
  education: {
    status: "paused",
    dependsOnProductModules: ["business"],
  },
  jobs: {
    status: "paused",
    dependsOnProductModules: ["classifieds"],
  },
  events: { status: "paused" },
  communication: {
    status: "paused",
    dependsOnProductModules: ["community"],
  },
  mobility: {
    status: "paused",
    dependsOnCapabilities: ["map"],
  },
  coupons: {
    status: "paused",
    dependsOnProductModules: ["business"],
  },
  gamification: { status: "paused" },
  communityAlerts: {
    status: "paused",
    dependsOnProductModules: ["community"],
  },
  communityIssues: {
    status: "paused",
    dependsOnProductModules: ["community"],
  },
  communityLostFound: {
    status: "paused",
    dependsOnProductModules: ["community"],
  },
  communityCommunication: {
    status: "paused",
    dependsOnProductModules: ["community"],
  },
  familySafety: { status: "paused" },
  billing: { status: "paused" },
  publicAnalytics: { status: "paused" },
};
