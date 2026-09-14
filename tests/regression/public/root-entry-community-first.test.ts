import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("root community-first MVP entry", () => {
  it("does not bypass the launch entry with remembered or profile territory", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");

    expect(source).toContain("return <TerritoryEntryPage />");
    expect(source).not.toContain("<Navigate");
    expect(source).not.toContain("lastTerritoryStore");
    expect(source).not.toContain("useUserTerritory");
    expect(source).not.toContain("homeDistrict");
    expect(source).not.toContain("homeCity");
  });

  it("preserves the explicit prelaunch lockdown override", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");

    expect(source).toContain("VITE_PRELAUNCH_LOCKDOWN");
    expect(source).toContain("return <PreLaunchLandingPage />");
  });

  it("keeps map WebGL and boundary work off the initial path until near the viewport", () => {
    const source = read(
      "src/app/components/territory-vivo/TerritoryEntryMap.tsx",
    );

    expect(source).toContain("lazy(() =>");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain('rootMargin: "240px 0px"');
    expect(source).toContain("enabled: shouldMountMap");
  });

  it("loads and decodes the large community preview image without blocking first render", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
  });

  it("renders the root entry without loading the full app route tree first", () => {
    const source = read("src/app/routes/AppRoutes.tsx");

    expect(source).toContain('<Route path="/" element={<RootRouteEntry />} />');
    expect(source).toContain('const AppLayoutRoutes = lazy(() =>');
    expect(source).not.toContain(
      'import { AppLayoutRoutes } from "@/app/routes/sections/AppLayoutRoutes"',
    );
  });
});
