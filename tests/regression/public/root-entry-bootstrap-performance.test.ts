import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("anonymous root bootstrap performance", () => {
  it("keeps anonymous consent local without statically importing Supabase", () => {
    const source = read("src/core/privacy/services/ConsentService.ts");

    expect(source).not.toContain(
      'import { supabase } from "@/integrations/supabase"',
    );
    expect(source).not.toContain(
      'import { PrivacyRpcService } from "./PrivacyRpcService"',
    );
    expect(source).toContain('await import("@/integrations/supabase")');
    expect(source).toContain('await import("./PrivacyRpcService")');
    expect(source).toContain("if (!userId) return null");
    expect(source).toContain("if (!input.userId) return");
  });

  it("reads consent identity from SessionState without auth or query runtimes", () => {
    const banner = read("src/app/components/privacy/ConsentBanner.tsx");
    const selector = read("src/core/session/hooks/useSessionUserId.ts");

    expect(banner).toContain("useSessionUserId");
    expect(banner).toContain("ConsentService.getExistingConsents");
    expect(banner).toContain("ConsentService.saveConsentPreferences");
    expect(banner).not.toContain("useAuth");
    expect(banner).not.toContain("@tanstack/react-query");
    expect(banner).not.toContain("useToast");
    expect(selector).toContain("SessionState.subscribe");
    expect(selector).toContain("SessionState.getState().user?.id");
    expect(selector).not.toContain("AuthService");
    expect(selector).not.toContain("SessionService");
  });

  it("loads advanced consent controls only when personalization is requested", () => {
    const banner = read("src/app/components/privacy/ConsentBanner.tsx");
    const details = read("src/app/components/privacy/ConsentPreferencesDialog.tsx");

    expect(banner).toContain('import("./ConsentPreferencesDialog")');
    expect(banner).toContain("lazy(loadConsentPreferencesDialog)");
    expect(banner).toContain("showDetails ?");
    expect(banner).not.toContain('from "@/shared/components/ui/dialog"');
    expect(banner).not.toContain('from "@/shared/components/ui/switch"');
    expect(details).toContain('from "@/shared/components/ui/dialog"');
    expect(details).toContain('from "@/shared/components/ui/switch"');
  });

  it("defers last-territory storage hydration until the store is consumed", () => {
    const store = read("src/core/routing/stores/LastTerritoryStore.ts");

    expect(store).toContain("private hydrated = false");
    expect(store).toContain("private hydrate(): void");
    expect(store).toContain("get(): LastTerritory | null {\n    this.hydrate();");
    expect(store).toContain("subscribe(listener: () => void): () => void {\n    this.hydrate();");
    expect(store).not.toContain("constructor()");
  });

  it("renders the public root outside router and the full app provider tree", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const routedRuntime = read("src/app/components/RoutedAppRuntime.tsx");
    const rootPage = read("src/app/pages/TerritoryEntryPage.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");

    expect(runtime).toContain('import RootRouteEntry from "@/app/routes/RootRouteEntry"');
    expect(runtime).toContain('import("@/app/components/RoutedAppRuntime")');
    expect(runtime).toContain('import("@/app/components/PublicRootOverlays")');
    expect(runtime).toContain("<RootRouteEntry />");
    expect(runtime).toContain("shouldUseLeanPublicRoot");
    expect(runtime).toContain("scheduleAfterPublicRootMap");
    expect(runtime).not.toContain('from "react-router-dom"');
    expect(runtime).not.toContain("BrowserRouter");

    expect(rootPage).not.toContain('from "react-router-dom"');
    expect(rootPage).not.toContain("<Link");
    expect(rootPage).toContain('href={LAUNCH_URLS.community}');

    expect(routedRuntime).toContain('from "react-router-dom"');
    expect(routedRuntime).toContain("<BrowserRouter>");
    expect(routedRuntime).toContain("<FullAppRuntimeShell");

    expect(runtime).not.toContain("QueryClientProvider");
    expect(runtime).not.toContain("HelmetProvider");
    expect(runtime).not.toContain("AccessibilityProvider");
    expect(runtime).not.toContain('import { AppRoutes }');
    expect(runtime).not.toContain("FullScreenLoader");
    expect(runtime).not.toContain('import { ErrorBoundary }');

    expect(fullShell).toContain("QueryClientProvider");
    expect(fullShell).toContain("HelmetProvider");
    expect(fullShell).toContain("AccessibilityProvider");
    expect(fullShell).toContain("<ErrorBoundary>");
  });

  it("preserves saved accessibility preferences without loading the provider", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).toContain("useLayoutEffect");
    expect(runtime).toContain('localStorage.getItem("accessibility-high-contrast")');
    expect(runtime).toContain('localStorage.getItem("accessibility-font-size")');
    expect(runtime).toContain('body.classList.toggle("accessibility-high-contrast"');
  });

  it("mounts provider-free public overlays after load and first-map readiness", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const overlays = read("src/app/components/PublicRootOverlays.tsx");

    expect(runtime).toContain("shouldMountOverlays");
    expect(runtime).toContain('document.readyState === "complete"');
    expect(runtime).toContain('window.addEventListener("load", scheduleOverlays');
    expect(runtime).toContain("scheduleAfterPublicRootMap");
    expect(runtime).toContain("maxWaitMs: 2600");
    expect(runtime).toContain("idleTimeoutMs: 2500");
    expect(runtime).toContain("idleFallbackDelayMs: 1200");

    expect(overlays).toContain("<BrowserRouter>");
    expect(overlays).toContain("<ConsentBanner />");
    expect(overlays).not.toContain("QueryClientProvider");
    expect(overlays).not.toContain("queryClient");
    expect(overlays).not.toContain("<Toaster />");
    expect(overlays).not.toContain("GlobalOverlays");
    expect(overlays).not.toContain("OfflineIndicator");
    expect(overlays).not.toContain("Sonner");
  });

  it("keeps optional font networking behind the first-map priority window", () => {
    const html = read("index.html");
    const main = read("src/main.tsx");

    expect(html).toContain("data-public-font-stylesheet");
    expect(html).toContain("display=optional");
    expect(html).not.toContain('fetchpriority="low"');
    expect(html).not.toContain('rel="preconnect" href="https://fonts.googleapis.com"');
    expect(html).not.toContain('rel="preconnect" href="https://fonts.gstatic.com"');
    expect(html).not.toContain("font-bootstrap.js");
    expect(main).toContain('meta[data-public-font-stylesheet]');
    expect(main).toContain('stylesheet.rel = "stylesheet"');
    expect(main).toContain("scheduleAfterPublicRootMap(loadOptionalFontStylesheet");
    expect(main).toContain("maxWaitMs: 2400");
    expect(fs.existsSync(path.join(ROOT, "public/font-bootstrap.js"))).toBe(false);
    expect(html).toContain('rel="preconnect" href="https://tiles.openfreemap.org" crossorigin');
    expect(html).toContain('rel="dns-prefetch" href="//tiles.openfreemap.org"');
  });

  it("keeps router, query and state libraries in separate vendor chunks", () => {
    const vite = read("vite.config.ts");

    expect(vite).toContain('return "vendor-router"');
    expect(vite).toContain('return "vendor-query"');
    expect(vite).toContain('return "vendor-state"');
    expect(vite).toContain('return "vendor-ui-utils"');
    expect(vite).not.toContain('return "vendor-runtime"');
  });

  it("keeps AdSense off HTML parsing and behind first-map readiness on root", () => {
    const html = read("index.html");
    const main = read("src/main.tsx");

    expect(html).not.toContain("adsense-bootstrap.js");
    expect(fs.existsSync(path.join(ROOT, "public/adsense-bootstrap.js"))).toBe(false);
    expect(main).toContain("data-acheguese-adsense");
    expect(main).toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
    expect(main).toContain("ads.async = true");
    expect(main).toContain("scheduleAfterPublicRootMap(loadAds");
    expect(main).toContain("maxWaitMs: 3200");
  });

  it("keeps Web Vitals measurement lightweight and attaches Sentry later", () => {
    const main = read("src/main.tsx");
    const vitals = read("src/shared/utils/webVitals.ts");
    const reporter = read("src/shared/utils/webVitalsSentryReporter.ts");

    expect(vitals).toContain("setWebVitalsReporter");
    expect(vitals).toContain("pendingReports");
    expect(vitals).not.toContain("@/shared/config/sentry.config");
    expect(vitals).not.toContain("@/shared/utils/logger");
    expect(reporter).toContain("addSentryBreadcrumb");
    expect(reporter).toContain("setWebVitalsReporter");
    expect(main).toContain("initializeObservability");
    expect(main).toContain("installWebVitalsSentryReporter");
    expect(main).toContain("scheduleAfterPublicRootMap(initializeObservability");
  });

  it("does not run the obsolete service-worker bootstrap before React", () => {
    const html = read("index.html");

    expect(html).not.toContain("service-worker-bootstrap.js");
    expect(
      fs.existsSync(path.join(ROOT, "public/service-worker-bootstrap.js")),
    ).toBe(false);
  });

  it("keeps MapLibre and full-route services out of the public bootstrap", () => {
    const main = read("src/main.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");
    const adapterOwner = read("src/core/maps/components/v3/MapLibreAdapter.tsx");
    const passiveRuntime = read("src/core/maps/components/v3/MapLibrePassiveRuntime.tsx");
    const runtimeLoader = read("src/core/maps/runtime/loadMapLibreRuntime.ts");
    const workerRuntime = read("src/core/maps/config/maplibreWorkerRuntime.ts");

    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain("CapabilityPreviewService");
    expect(main).not.toContain("setupDefaultProviders");
    expect(main).not.toContain("maplibreWorkerRuntime");

    expect(fullShell).toContain("CapabilityPreviewService");
    expect(fullShell).toContain("setupDefaultProviders");
    expect(fullShell).not.toContain("maplibreWorkerRuntime");
    expect(fullShell).not.toContain("ensureMapLibreWorkerConfigured");

    expect(adapterOwner).toContain("canUsePassiveRuntime");
    expect(adapterOwner).toContain("LazyPassiveMapLibreRuntime");
    expect(adapterOwner).toContain('import("./MapLibrePassiveRuntime")');
    expect(adapterOwner).toContain('import("./MapLibreAdapterRuntime")');
    expect(passiveRuntime).not.toContain("useRobustGeolocation");
    expect(passiveRuntime).not.toContain("useMapClustering");
    expect(runtimeLoader).toContain('import("maplibre-gl")');
    expect(runtimeLoader).toContain("ensureMapLibreWorkerConfigured(runtime.setWorkerUrl)");
    expect(workerRuntime).not.toContain('from "maplibre-gl"');
    expect(workerRuntime).toContain("maplibre-gl-worker.mjs?worker&url");
    expect(workerRuntime).toContain("workerConfigured");
  });
});
