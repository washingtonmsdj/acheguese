import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Territory Home ownership", () => {
  it("keeps TerritoryHomePage as the only city/district Home owner", () => {
    const appRoutes = read("src/app/routes/AppRoutes.tsx");
    const layoutRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(layoutRoutes).toContain(
      "CityLandingComponent={TerritoryHomePage}",
    );
    expect(appRoutes).toContain(
      '<Route path="/" element={<RootRouteEntry />} />',
    );
  });

  it("does not recreate retired competing Home owners", () => {
    for (const relativePath of [
      "src/app/pages/PublicCityLandingPage.tsx",
      "src/app/pages/PublicCityLandingPage.css",
      "src/app/pages/TerritoryExplorerPage.tsx",
      "src/app/pages/NationalHubPage.tsx",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(
        false,
      );
    }
  });

  it("does not keep stale route/import aliases for retired Home owners", () => {
    const prefetch = read("src/app/routes/prefetch.ts");
    const lazyImports = read("src/app/routes/lazyImports.ts");
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(prefetch).not.toContain("PublicCityLandingPage");
    expect(prefetch).not.toContain("TerritoryExplorerPage");
    expect(lazyImports).not.toContain("NationalHubPage");
    expect(routes).not.toContain('path="/inicio"');
  });
});
