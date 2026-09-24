import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("MVP territorial home ownership", () => {
  it("routes territory indexes directly to the canonical Home", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(routes).toContain('import TerritoryHomePage from "@/app/pages/TerritoryHomePage"');
    expect(routes).toContain("element={<TerritoryHomePage />}");
    expect(routes).not.toContain("TerritorialIndexPage");
  });

  it("keeps the retired multi-domain territorial landing out of runtime", () => {
    for (const retired of [
      "src/core/routing/components/TerritorialIndexPage.tsx",
      "src/core/routing/components/TerritorialLandingPage.tsx",
      "src/core/landing/hooks/useLandingFeatured.ts",
      "src/core/landing/hooks/createLandingFeaturedService.ts",
    ]) {
      expect(existsSync(resolve(root, retired))).toBe(false);
    }

    const coreLanding = read("src/core/landing/index.ts");
    const appLanding = read("src/app/features/landing/index.ts");
    expect(coreLanding).not.toContain("useLandingFeatured");
    expect(coreLanding).not.toContain("createLandingFeaturedService");
    expect(appLanding).not.toContain("useLandingFeatured");
    expect(appLanding).not.toContain("createLandingFeaturedService");
  });
});
