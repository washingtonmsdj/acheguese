import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { PRODUCT_MODULE_REGISTRY } from "../../../src/app/config/productModuleRegistry";
import { PLATFORM_CAPABILITY_REGISTRY } from "../../../src/app/config/platformCapabilityRegistry";
import {
  getActivePlatformCapabilities,
  getActiveProductModules,
} from "../../../src/app/config/lifecycleRegistry";
import { isLaunchSurfaceEnabled } from "../../../src/app/config/launchScope";

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), "utf-8");
}

describe("Territory Home launch-scope regression", () => {
  it("keeps Business active with horizontal Map/Nearby/Search capabilities", () => {
    expect(getActiveProductModules()).toEqual(["business"]);
    expect(getActivePlatformCapabilities()).toEqual(
      expect.arrayContaining(["map", "nearby", "search"]),
    );
    expect(PRODUCT_MODULE_REGISTRY.business.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.nearby).toEqual({
      status: "active",
      dependsOnCapabilities: ["map", "location"],
      dependsOnProductModules: ["business"],
    });

    expect(isLaunchSurfaceEnabled("business")).toBe(true);
    expect(isLaunchSurfaceEnabled("map")).toBe(true);
    expect(isLaunchSurfaceEnabled("nearby")).toBe(true);
    expect(isLaunchSurfaceEnabled("community")).toBe(false);
    expect(isLaunchSurfaceEnabled("classifieds")).toBe(false);
    expect(isLaunchSurfaceEnabled("search")).toBe(true);
  });

  it("keeps Home as infrastructure with only MVP destinations", () => {
    const source = read("src/app/pages/TerritoryHomePage.tsx");

    expect(source).toContain("MODULE_SLUGS.business");
    expect(source).toContain("MODULE_SLUGS.map");
    expect(source).toContain("APP_MODULE_SLUGS.nearby");
    expect(source).toContain("MODULE_SLUGS.search");
    expect(source).not.toContain("isLaunchSurfaceEnabled");
    expect(source).not.toContain("MODULE_SLUGS.community");
    expect(source).not.toContain("MODULE_SLUGS.classifieds");
    expect(source).not.toContain("MODULE_SLUGS.services");
    expect(source).not.toContain("MODULE_SLUGS.gastronomy");
  });
});
