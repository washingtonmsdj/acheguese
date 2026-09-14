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

  it("preserves lockdown without shipping the prelaunch page in the normal entry bundle", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");

    expect(source).toContain("VITE_PRELAUNCH_LOCKDOWN");
    expect(source).toContain("LazyPreLaunchLandingPage");
    expect(source).toContain('import("@/app/pages/PreLaunchLandingPage")');
    expect(source).not.toContain(
      'import PreLaunchLandingPage from "@/app/pages/PreLaunchLandingPage"',
    );
  });

  it("keeps the entry map wrapper light until near the viewport and browser idle", () => {
    const wrapper = read(
      "src/app/components/territory-vivo/TerritoryEntryMap.tsx",
    );
    const runtime = read(
      "src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx",
    );

    expect(wrapper).toContain("LazyTerritoryEntryMapRuntime");
    expect(wrapper).toContain("IntersectionObserver");
    expect(wrapper).toContain('rootMargin: "240px 0px"');
    expect(wrapper).toContain("scheduleBrowserIdleWork");
    expect(wrapper).not.toContain("useTerritoryPolygon");
    expect(wrapper).not.toContain("MapLibreAdapter");

    expect(runtime).toContain("useTerritoryPolygon");
    expect(runtime).toContain("LazyMapLibreAdapter");
    expect(runtime).toContain('interactive={false}');
  });

  it("defers territorial data resolution so the first paint stays independent of Supabase", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain("scheduleBrowserIdleWork");
    expect(source).toContain(
      "Promise.all([getLaunchCity(), getLaunchResolvedTerritory()])",
    );
    expect(source).toContain("await import(");
    expect(source).toContain(
      '"@/core/location/repositories/createLocationRepository"',
    );
    expect(source).toContain('await import("@/core/territorial")');
    expect(source).not.toContain(
      'import { createLocationRepository } from "@/core/location/repositories/createLocationRepository"',
    );
    expect(source).not.toContain(
      'import { territorialGroupService } from "@/core/territorial"',
    );
  });

  it("loads and decodes the large community preview image without blocking first render", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
    expect(source).toContain('fetchPriority="low"');
  });

  it("keeps the launch preview asset inside a conservative entry-page budget", () => {
    const assetPath = path.join(ROOT, "src/assets/hero-complexo-nordeste.jpg");
    const bytes = fs.statSync(assetPath).size;

    expect(bytes).toBeLessThanOrEqual(450_000);
  });

  it("renders the normal root directly without loading the full app route tree", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const routes = read("src/app/routes/AppRoutes.tsx");

    expect(runtime).toContain('import RootRouteEntry from "@/app/routes/RootRouteEntry"');
    expect(runtime).toContain("<RootRouteEntry />");
    expect(runtime).not.toContain('import { AppRoutes }');

    expect(routes).toContain('const RootRouteEntry = lazy(() => import("@/app/routes/RootRouteEntry"))');
    expect(routes).toContain('const LaunchPausedPage = lazy(() => import("@/app/pages/LaunchPausedPage"))');
    expect(routes).toContain('const AppLayoutRoutes = lazy(() =>');
  });

  it("keeps the public root outside Supabase session and multi-profile initialization", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");
    const sessionShell = read("src/app/components/SessionProfileRuntimeShell.tsx");

    expect(runtime).toContain('location.pathname === "/"');
    expect(runtime).toContain('import("@/app/components/FullAppRuntimeShell")');
    expect(runtime).not.toContain("SessionProvider");
    expect(runtime).not.toContain("MultiProfileProvider");

    expect(fullShell).toContain("SessionProfileRuntimeShell");
    expect(sessionShell).toContain("<SessionProvider>");
    expect(sessionShell).toContain("<MultiProfileProvider>");
    expect(sessionShell).toContain("<TerritoryModeInitializer />");
    expect(sessionShell).toContain("<ModuleContextSync />");
  });

  it("does not load auth redirect code on normal root visits", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");

    expect(runtime).toContain("shouldCheckAuthRedirect");
    expect(runtime).toContain("location.hash.length > 1");
    expect(runtime).toContain('searchParams.has("code")');
    expect(runtime).toContain("!shouldCheckAuthRedirect");
    expect(fullShell).toContain(
      "shouldCheckAuthRedirect ? <AuthHashRedirect /> : null",
    );
  });

  it("does not statically import MapLibre or warm its worker in the bootstrap entry", () => {
    const main = read("src/main.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");

    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain('from "maplibre-gl/dist/maplibre-gl-worker');
    expect(main).not.toContain("maplibreWorkerRuntime");
    expect(fullShell).toContain(
      'import("@/core/maps/config/maplibreWorkerRuntime")',
    );
  });

  it("keeps one primary exploration action and an accessible mobile menu", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain('className="entry-community-preview"');
    expect(source).not.toContain('to={LAUNCH_URLS.community} className="entry-community-preview"');
    expect(source).toContain('className="entry-explore-link"');
    expect(source).toContain('aria-controls="entry-mobile-menu-popover"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('document.addEventListener("pointerdown"');
    expect(source).toContain("mobileMenuButtonRef.current?.focus()");
    expect(source).toContain('href="#main-content"');
    expect(source).toContain('id="main-content"');
  });
});
