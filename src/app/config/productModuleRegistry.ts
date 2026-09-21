export type ProductModuleStatus = "active" | "paused";

export type ProductModuleKey =
  | "business"
  | "map"
  | "nearby"
  | "search"
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
  dependsOn?: readonly ProductModuleKey[];
}

export const PRODUCT_MODULE_REGISTRY: Record<
  ProductModuleKey,
  ProductModuleLifecycle
> = {
  business: { status: "active" },
  map: { status: "active" },
  nearby: { status: "active", dependsOn: ["map", "business"] },
  search: { status: "paused" },

  community: { status: "paused" },
  gastronomy: { status: "paused", dependsOn: ["business"] },
  services: { status: "paused" },
  classifieds: { status: "paused" },
  touristPoints: { status: "paused", dependsOn: ["map"] },
  education: { status: "paused", dependsOn: ["business"] },
  jobs: { status: "paused", dependsOn: ["classifieds"] },
  events: { status: "paused" },
  communication: { status: "paused", dependsOn: ["community"] },
  mobility: { status: "paused", dependsOn: ["map"] },
  coupons: { status: "paused", dependsOn: ["business"] },
  gamification: { status: "paused" },
  communityAlerts: { status: "paused", dependsOn: ["community"] },
  communityIssues: { status: "paused", dependsOn: ["community"] },
  communityLostFound: { status: "paused", dependsOn: ["community"] },
  communityCommunication: { status: "paused", dependsOn: ["community"] },
  familySafety: { status: "paused" },
  billing: { status: "paused" },
  publicAnalytics: { status: "paused" },
};

function isEnabled(
  module: ProductModuleKey,
  visiting: ReadonlySet<ProductModuleKey>,
): boolean {
  if (visiting.has(module)) return false;

  const config = PRODUCT_MODULE_REGISTRY[module];
  if (config.status !== "active") return false;

  const next = new Set(visiting);
  next.add(module);

  return (config.dependsOn ?? []).every((dependency) =>
    isEnabled(dependency, next),
  );
}

export function isProductModuleEnabled(module: ProductModuleKey): boolean {
  return isEnabled(module, new Set());
}

export function getActiveProductModules(): ProductModuleKey[] {
  return (Object.keys(PRODUCT_MODULE_REGISTRY) as ProductModuleKey[]).filter(
    isProductModuleEnabled,
  );
}
