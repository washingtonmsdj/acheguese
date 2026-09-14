import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("root community-first MVP entry", () => {
  it("keeps the launch entry authoritative", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");
    expect(source).toContain("return <TerritoryEntryPage />");
    expect(source).not.toContain("<Navigate");
    expect(source).not.toContain("lastTerritoryStore");
    expect(source).not.toContain("useUserTerritory");
  });

  it("keeps lockdown lazy", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");
    expect(source).toContain("VITE_PRELAUNCH_LOCKDOWN");
    expect(source).toContain('import("@/app/pages/PreLaunchLandingPage")');
  });

  it("starts the entry map near the viewport without waiting for territory data", () => {
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    expect(wrapper).toContain("LazyTerritoryEntryMapRuntime");
    expect(wrapper).toContain("IntersectionObserver");
    expect(wrapper).toContain('rootMargin: "720px 0px"');
    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).not.toContain("scheduleBrowserIdleWork");
    expect(wrapper).not.toContain("if (isLoading || shouldMountRuntime) return");
    expect(wrapper).not.toContain("useTerritoryPolygon");
    expect(wrapper).not.toContain("MapLibreAdapter");
  });

  it("uses the versioned launch territory without database discovery", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain(
      'import { resolvePublicTerritoryFallback } from "@/core/routing/utils/publicTerritoryFallbacks"',
    );
    expect(source).toContain("const launchTerritory = resolvePublicTerritoryFallback");
    expect(source).toContain("resolvedTerritory={launchTerritory}");
    expect(source).toContain("isLoading={false}");
    expect(source).not.toContain("createLocationRepository");
    expect(source).not.toContain("territorialGroupService");
    expect(source).not.toContain("findDescendants");
    expect(source).not.toContain("scheduleBrowserIdleWork");
  });

  it("uses a lightweight low-priority community preview", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    const asset = path.join(ROOT, "src/assets/complexo-cultura.jpg");

    expect(source).toContain('import communityThumbnail from "@/assets/complexo-cultura.jpg"');
    expect(source).toContain('width={1024}');
    expect(source).toContain('height={768}');
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
    expect(source).toContain('fetchPriority="low"');
    expect(source).not.toContain("hero-complexo-nordeste.jpg");
    expect(fs.statSync(asset).size).toBeLessThanOrEqual(160_000);
  });

  it("renders the normal root outside the full app runtime", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    expect(runtime).toContain('import RootRouteEntry from "@/app/routes/RootRouteEntry"');
    expect(runtime).toContain("<RootRouteEntry />");
    expect(runtime).toContain('import("@/app/components/FullAppRuntimeShell")');
    expect(runtime).not.toContain("SessionProvider");
    expect(runtime).not.toContain("QueryClientProvider");
  });

  it("does not warm MapLibre globally from main", () => {
    const main = read("src/main.tsx");
    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain("maplibreWorkerRuntime");
  });

  it("keeps one primary exploration action and an accessible mobile menu", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(source).not.toContain('to={LAUNCH_URLS.community} className="entry-community-preview"');
    expect(source).toContain('className="entry-explore-link"');
    expect(source).toContain('aria-controls="entry-mobile-menu-popover"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('href="#main-content"');
  });
});
