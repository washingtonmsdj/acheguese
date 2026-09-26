import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("root business discovery MVP entry", () => {
  it("keeps the launch entry authoritative", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");
    expect(source).toContain("return <TerritoryEntryPage />");
    expect(source).not.toContain("<Navigate");
    expect(source).not.toContain("lastTerritoryStore");
    expect(source).not.toContain("useUserTerritory");
  });

  it("keeps lockdown lazy and delegated to launch scope", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");
    expect(source).toContain(
      'import { PRELAUNCH_LOCKDOWN_ENABLED } from "@/app/config/releaseMode";',
    );
    expect(source).toContain("if (PRELAUNCH_LOCKDOWN_ENABLED)");
    expect(source).not.toContain("VITE_PRELAUNCH_LOCKDOWN");
    expect(source).toContain('import("@/app/pages/PreLaunchLandingPage")');
  });

  it("requests the entry map runtime on the first render", () => {
    const wrapper = read("src/app/components/territory-vivo/TerritoryEntryMap.tsx");
    expect(wrapper).toContain("LazyTerritoryEntryMapRuntime");
    expect(wrapper).toContain("<Suspense");
    expect(wrapper).toContain("loadTerritoryEntryMapRuntime");
    expect(wrapper).not.toContain("shouldMountRuntime");
    expect(wrapper).not.toContain("setShouldMountRuntime");
    expect(wrapper).not.toContain("IntersectionObserver");
    expect(wrapper).not.toContain("scheduleBrowserIdleWork");
    expect(wrapper).not.toContain("useTerritoryPolygon");
    expect(wrapper).not.toContain("isLoading");
  });

  it("uses the versioned launch territory without database discovery or fake loading state", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(source).toContain("resolvePublicTerritoryFallback");
    expect(source).toContain("const launchTerritory = resolvePublicTerritoryFallback");
    expect(source).toContain("resolvedTerritory={launchTerritory}");
    expect(source).not.toContain("isLoading={false}");
    expect(source).not.toContain("createLocationRepository");
    expect(source).not.toContain("territorialGroupService");
    expect(source).not.toContain("findDescendants");
    expect(source).not.toContain("scheduleBrowserIdleWork");
  });

  it("keeps the root page free of router and icon libraries", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    const arrival = read("src/app/components/territory-vivo/TerritoryEntryMapArrival.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");
    expect(source).not.toContain("react-router-dom");
    expect(source).not.toContain("<Link");
    expect(source).not.toContain("lucide-react");
    expect(arrival).not.toContain("lucide-react");
    expect(runtime).not.toContain("lucide-react");
  });

  it("keeps the first screen free of the retired community preview request", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    const runtime = read("src/app/components/territory-vivo/TerritoryEntryMapRuntime.tsx");

    expect(source).not.toContain("complexo-cultura.jpg");
    expect(source).not.toContain("communityImageSrc");
    expect(source).toContain("<TerritoryEntryMap");
    expect(runtime).toContain("markers={[]}");
  });

  it("keeps mobile discovery actions before the map and neighborhood context", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain("data-entry-mobile-scroll-owner");
    expect(source).toContain('className="mvp-entry-content max-md:overflow-y-visible"');
    expect(source).toContain('className="mvp-entry-map-shell"');
    expect(source).toContain('className="mvp-neighborhood-card"');
    expect(source).toContain("mvp-entry-actions");
    expect(source).not.toContain("max-md:!overflow-y-auto");
  });

  it("renders the concept footer without a signup gate", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain('className="entry-footer"');
    expect(source).toContain("href={PRIVACY_POLICY_PATH}");
    expect(source).toContain('href="/conta/preferencias#acessibilidade"');
    expect(source).toContain("Disponível inicialmente no");
    expect(source).not.toContain('href="/indicar-comunidade"');
    expect(source).not.toContain('href={AUTH_PATHS.signup}');
  });

  it("keeps the normal root outside the routed/full app runtime", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    expect(runtime).toContain('import RootRouteEntry from "@/app/routes/RootRouteEntry"');
    expect(runtime).toContain("<RootRouteEntry />");
    expect(runtime).toContain('import("@/app/components/RoutedAppRuntime")');
    expect(runtime).not.toContain('from "react-router-dom"');
    expect(runtime).not.toContain("BrowserRouter");
    expect(runtime).not.toContain("SessionProvider");
    expect(runtime).not.toContain("QueryClientProvider");
  });

  it("does not warm MapLibre globally from main", () => {
    const main = read("src/main.tsx");
    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain("maplibreWorkerRuntime");
  });

  it("exposes search, map, nearby, and account paths from the public entry", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain("action={LAUNCH_URLS.search}");
    expect(source).toContain("href={LAUNCH_URLS.business}");
    expect(source).toContain("href={LAUNCH_URLS.map}");
    expect(source).toContain('href="/perto-de-mim"');
    expect(source).toContain("const accountHref");
    expect(source).toContain('aria-label="Navegação pública"');
    expect(source).not.toContain("isMobileMenuOpen");
    expect(source).not.toContain("entry-mobile-menu-popover");
  });
});
