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

  it("keeps lockdown lazy and delegated to launch scope", () => {
    const source = read("src/app/routes/RootRouteEntry.tsx");
    expect(source).toContain(
      'import { PRELAUNCH_LOCKDOWN_ENABLED } from "@/app/config/launchScope";',
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
  });

  it("uses the versioned launch territory without database discovery", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(source).toContain("resolvePublicTerritoryFallback");
    expect(source).toContain("const launchTerritory = resolvePublicTerritoryFallback");
    expect(source).toContain("resolvedTerritory={launchTerritory}");
    expect(source).toContain("isLoading={false}");
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

  it("defers the low-priority community preview behind the entry map", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    const asset = path.join(ROOT, "src/assets/complexo-cultura.jpg");
    expect(source).toContain('import communityThumbnail from "@/assets/complexo-cultura.jpg"');
    expect(source).toContain("shouldLoadCommunityImage");
    expect(source).toContain('window.matchMedia("(min-width: 768px)")');
    expect(source).toContain("scheduleAfterPublicRootMap");
    expect(source).toContain("maxWaitMs: 3000");
    expect(source).toContain("idleTimeoutMs: 1800");
    expect(source).toContain("idleFallbackDelayMs: 600");
    expect(source).not.toContain("requestIdleCallback");
    expect(source).not.toContain('window.addEventListener("load", scheduleAfterLoad');
    expect(source).toContain("shouldLoadCommunityImage ? communityThumbnail : undefined");
    expect(source).toContain('width={1024}');
    expect(source).toContain('height={768}');
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
    expect(source).toContain('fetchPriority="low"');
    expect(fs.statSync(asset).size).toBeLessThanOrEqual(160_000);
  });

  it("defers below-fold layout and paint without hiding content", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(source.match(/data-entry-deferred-paint/g)?.length).toBe(2);
    expect(source).toContain("entry-indication [content-visibility:auto] [contain-intrinsic-size:auto_9rem]");
    expect(source).toContain("entry-footer [content-visibility:auto] [contain-intrinsic-size:auto_4rem]");
    expect(source).toContain("Quer o Achegue-se na sua comunidade?");
    expect(source).toContain('href="/indicar-comunidade"');
    expect(source).toContain('import { PRIVACY_POLICY_PATH } from "@/shared/constants/legal";');
    expect(source.match(/href=\{PRIVACY_POLICY_PATH\}/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('href="/privacidade"');
  });

  it("renders the normal root outside routed/full app runtime", () => {
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

  it("keeps one primary exploration action and an accessible mobile menu", () => {
    const source = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(source).toContain('className="entry-explore-link"');
    expect(source).toContain('href={LAUNCH_URLS.community}');
    expect(source).toContain('aria-controls="entry-mobile-menu-popover"');
    expect(source).toContain('aria-label="Navegação pública móvel"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('href="#main-content"');
    expect(source.match(/href=\{PRIVACY_POLICY_PATH\}/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(source).toContain('window.matchMedia("(min-width: 768px)")');
    expect(source).toContain("if (desktopMedia.matches) {\n        setIsMobileMenuOpen(false);");
  });
});