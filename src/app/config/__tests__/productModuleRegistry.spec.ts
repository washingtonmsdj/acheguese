import { describe, expect, it } from "vitest";

import {
  PRODUCT_MODULE_REGISTRY,
  getActiveProductModules,
  isProductModuleEnabled,
  type ProductModuleKey,
} from "../productModuleRegistry";

describe("productModuleRegistry", () => {
  it("keeps the MVP product set exactly Business + Map + Nearby", () => {
    expect(getActiveProductModules().sort()).toEqual([
      "business",
      "map",
      "nearby",
    ]);
  });

  it("keeps Nearby dependent on both active base modules", () => {
    expect(PRODUCT_MODULE_REGISTRY.nearby.dependsOn).toEqual([
      "map",
      "business",
    ]);
    expect(isProductModuleEnabled("nearby")).toBe(true);
  });

  it("references only declared modules and contains no dependency cycle", () => {
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

      for (const dependency of PRODUCT_MODULE_REGISTRY[module].dependsOn ?? []) {
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

  it("fails closed for paused post-MVP modules", () => {
    for (const module of [
      "community",
      "search",
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
