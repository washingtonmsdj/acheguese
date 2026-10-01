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

  it("uses the versioned launch territory without database discovery or fake loading state", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(source).toContain("resolvePublicTerritoryFallback");
    expect(source).toContain("const launchTerritory = resolvePublicTerritoryFallback");
    expect(source).not.toContain("createLocationRepository");
    expect(source).not.toContain("territorialGroupService");
    expect(source).not.toContain("findDescendants");
    expect(source).not.toContain("scheduleBrowserIdleWork");
  });

  it("keeps the root page independent from routed and map runtimes", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(source).not.toContain("react-router-dom");
    expect(source).not.toContain("<Link");
    expect(source).not.toContain("maplibre-gl");
    expect(source).not.toContain("<TerritoryEntryMap");
    expect(source).not.toContain("useTerritoryPolygon");
  });

  it("keeps the first screen free of retired community preview data", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).not.toContain("complexo-cultura.jpg");
    expect(source).not.toContain("communityImageSrc");
    expect(source).not.toContain("useCommunityAccess");
    expect(source).not.toContain("CommunityService");
  });

  it("keeps discovery actions in the canonical MVP order", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    const business = source.indexOf('link: "Explorar empresas"');
    const map = source.indexOf('link: "Abrir o mapa"');
    const nearby = source.indexOf('link: "Ver perto de mim"');
    const search = source.indexOf('link: "Buscar no território"');

    expect(business).toBeGreaterThan(-1);
    expect(map).toBeGreaterThan(business);
    expect(nearby).toBeGreaterThan(map);
    expect(search).toBeGreaterThan(nearby);
  });

  it("renders the public footer without a signup gate", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain('className="ag-footer"');
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

  it("exposes Business, Map, Nearby, Search and Account from the public entry", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source).toContain("const launchBusinessUrl = LAUNCH_URLS.business");
    expect(source).toContain("const launchMapUrl = LAUNCH_URLS.map");
    expect(source).toContain("const launchNearbyUrl = LAUNCH_URLS.nearby");
    expect(source).toContain("const launchSearchUrl = LAUNCH_URLS.search");
    expect(source).toContain("const accountHref");
    expect(source).toContain('aria-label="Navegação principal"');
  });
});
