import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(
    path.join(ROOT, relativePath),
    "utf8",
  );
}

describe("Territory Home ownership", () => {
  it("keeps TerritoryHomePage as the only city/district Home owner", () => {
    const routes = read(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );

    expect(routes).toContain(
      "CityLandingComponent={TerritoryHomePage}",
    );
    expect(routes).toContain(
      '<Route path="/" element={<RootRouteEntry />} />',
    );
  });

  it("does not recreate retired city landing aliases", () => {
    for (const relativePath of [
      "src/app/pages/PublicCityLandingPage.tsx",
      "src/app/pages/PublicCityLandingPage.css",
      "src/app/pages/TerritoryExplorerPage.tsx",
    ]) {
      expect(
        fs.existsSync(path.join(ROOT, relativePath)),
        relativePath,
      ).toBe(false);
    }
  });

  it("does not prefetch the retired city landing chunk", () => {
    const prefetch = read("src/app/routes/prefetch.ts");

    expect(prefetch).not.toContain("PublicCityLandingPage");
    expect(prefetch).not.toContain("TerritoryExplorerPage");
  });
});
