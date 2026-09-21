import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  getActiveProductModules,
  PRODUCT_MODULE_REGISTRY,
} from "../../../src/app/config/productModuleRegistry";
import { isLaunchSurfaceEnabled } from "../../../src/app/config/launchScope";

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), "utf-8");
}

describe("Territory Home launch-scope regression", () => {
  it("keeps exactly the three MVP modules active", () => {
    expect(getActiveProductModules().sort()).toEqual(
      ["business", "map", "nearby"].sort(),
    );
    expect(PRODUCT_MODULE_REGISTRY.nearby.dependsOn).toEqual([
      "map",
      "business",
    ]);

    expect(isLaunchSurfaceEnabled("business")).toBe(true);
    expect(isLaunchSurfaceEnabled("map")).toBe(true);
    expect(isLaunchSurfaceEnabled("nearby")).toBe(true);
    expect(isLaunchSurfaceEnabled("community")).toBe(false);
    expect(isLaunchSurfaceEnabled("classifieds")).toBe(false);
    expect(isLaunchSurfaceEnabled("search")).toBe(false);
  });

  it("keeps Home as infrastructure with only MVP destinations", () => {
    const source = read("src/app/pages/TerritoryHomePage.tsx");

    expect(source).toContain("MODULE_SLUGS.business");
    expect(source).toContain("MODULE_SLUGS.map");
    expect(source).toContain("APP_MODULE_SLUGS.nearby");
    expect(source).not.toContain("isLaunchSurfaceEnabled");
    expect(source).not.toContain("MODULE_SLUGS.community");
    expect(source).not.toContain("MODULE_SLUGS.classifieds");
    expect(source).not.toContain("MODULE_SLUGS.services");
    expect(source).not.toContain("MODULE_SLUGS.gastronomy");
    expect(source).not.toContain("MODULE_SLUGS.search");
  });
});
