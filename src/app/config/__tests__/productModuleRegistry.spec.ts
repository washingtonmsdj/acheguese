import { describe, expect, it } from "vitest";

import {
  PRODUCT_MODULE_REGISTRY,
  type ProductModuleKey,
} from "../productModuleRegistry";
import {
  getActiveProductModules,
  isProductModuleEnabled,
} from "../lifecycleRegistry";

describe("productModuleRegistry", () => {
  it("keeps Business as the only active domain module in the MVP", () => {
    expect(getActiveProductModules()).toEqual(["business"]);
    expect(isProductModuleEnabled("business")).toBe(true);
  });

  it("keeps cross-domain dependencies explicit without treating platform capabilities as product modules", () => {
    expect(PRODUCT_MODULE_REGISTRY.gastronomy.dependsOnProductModules).toEqual([
      "business",
    ]);
    expect(PRODUCT_MODULE_REGISTRY.education.dependsOnProductModules).toEqual([
      "business",
    ]);
    expect(PRODUCT_MODULE_REGISTRY.touristPoints.dependsOnCapabilities).toEqual([
      "map",
    ]);
    expect(PRODUCT_MODULE_REGISTRY.mobility.dependsOnCapabilities).toEqual([
      "map",
    ]);
  });

  it("references only declared product-module dependencies and contains no product dependency cycle", () => {
    const keys = new Set(
      Object.keys(PRODUCT_MODULE_REGISTRY) as ProductModuleKey[],
    );

    const visit = (
      module: ProductModuleKey,
      path: ReadonlySet<ProductModuleKey>,
    ): void => {
      expect(path.has(module), `dependency cycle at ${module}`).toBe(false);

      const nextPath = new Set(path);
      nextPath.add(module);

      for (const dependency of
        PRODUCT_MODULE_REGISTRY[module].dependsOnProductModules ?? []) {
        expect(keys.has(dependency), `${module} -> missing ${dependency}`).toBe(
          true,
        );
        visit(dependency, nextPath);
      }
    };

    for (const module of keys) {
      visit(module, new Set());
    }
  });

  it("fails closed for paused post-MVP domain modules", () => {
    for (const module of [
      "community",
      "gastronomy",
      "services",
      "classifieds",
      "touristPoints",
      "education",
      "jobs",
      "events",
      "communication",
      "mobility",
      "coupons",
      "gamification",
      "communityCommunication",
      "billing",
      "publicAnalytics",
    ] as const) {
      expect(isProductModuleEnabled(module), module).toBe(false);
    }
  });
});
