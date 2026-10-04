import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  PRODUCT_MODULE_REGISTRY,
  type ProductModuleKey,
} from "../../src/app/config/productModuleRegistry";

const ROOT = process.cwd();

type PausedProductModuleKey = Exclude<ProductModuleKey, "business">;

/**
 * Canonical source owners for product modules that are intentionally paused at
 * launch. A paused lifecycle does not mean the product source may be deleted.
 *
 * Some lifecycle keys map to nested bounded contexts or horizontal core owners
 * instead of a same-name top-level directory. This map is the executable bridge
 * between lifecycle naming and the physical SSOT taxonomy.
 */
const PAUSED_PRODUCT_OWNER_PATHS: Record<
  PausedProductModuleKey,
  readonly string[]
> = {
  community: [
    "src/core/community-experience",
    "src/core/community/pages",
    "src/core/community/pages/CommunityIndicationPage.tsx",
  ],
  gastronomy: ["src/modules/business/gastronomy"],
  services: ["src/modules/professionals/services"],
  classifieds: ["src/modules/classifieds"],
  touristPoints: ["src/modules/guide"],
  education: ["src/modules/business/education"],
  jobs: ["src/modules/classifieds/jobs"],
  events: ["src/modules/community-events"],
  communication: ["src/modules/communication-territorial"],
  mobility: ["src/modules/mobility"],
  coupons: ["src/modules/business/promotions"],
  gamification: ["src/modules/gamification"],
  communityAlerts: ["src/core/community/alerts"],
  communityIssues: ["src/modules/community-issues"],
  communityLostFound: ["src/modules/community-lost-found"],
  communityCommunication: [
    "src/modules/communication-territorial/pages/CommunityCommunicationTabPage.tsx",
  ],
  familySafety: ["src/core/family"],
  billing: ["src/modules/billing"],
  publicAnalytics: ["src/core/analytics/AnalyticsService.ts"],
};

describe("paused product owner map", () => {
  it("keeps every non-MVP product key explicitly mapped to preserved source owners", () => {
    const pausedKeys = Object.entries(PRODUCT_MODULE_REGISTRY)
      .filter(([, lifecycle]) => lifecycle.status === "paused")
      .map(([key]) => key)
      .sort();

    expect(Object.keys(PAUSED_PRODUCT_OWNER_PATHS).sort()).toEqual(pausedKeys);
  });

  it("keeps every declared paused owner physically versioned", () => {
    for (const [moduleKey, ownerPaths] of Object.entries(
      PAUSED_PRODUCT_OWNER_PATHS,
    )) {
      expect(PRODUCT_MODULE_REGISTRY[moduleKey as PausedProductModuleKey].status).toBe(
        "paused",
      );

      for (const ownerPath of ownerPaths) {
        expect(
          fs.existsSync(path.join(ROOT, ownerPath)),
          `${moduleKey} owner missing: ${ownerPath}`,
        ).toBe(true);
      }
    }
  });

  it("keeps Business as the only product module active in the MVP registry", () => {
    const activeKeys = Object.entries(PRODUCT_MODULE_REGISTRY)
      .filter(([, lifecycle]) => lifecycle.status === "active")
      .map(([key]) => key);

    expect(activeKeys).toEqual(["business"]);
  });
});
