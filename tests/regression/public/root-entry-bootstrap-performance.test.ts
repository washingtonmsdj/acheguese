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

  it("renders the public root outside the full app provider tree", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const fullShell = read("src/app/components/FullAppRuntimeShell.tsx");

    expect(runtime).toContain('import RootRouteEntry from "@/app/routes/RootRouteEntry"');
    expect(runtime).toContain('import("@/app/components/FullAppRuntimeShell")');
    expect(runtime).toContain('import("@/app/components/PublicRootOverlays")');
    expect(runtime).toContain("<RootRouteEntry />");
    expect(runtime).toContain("scheduleBrowserIdleWork");

    expect(runtime).not.toContain("QueryClientProvider");
    expect(runtime).not.toContain("HelmetProvider");
    expect(runtime).not.toContain("AccessibilityProvider");
    expect(runtime).not.toContain('import { AppRoutes }');
    expect(runtime).not.toContain("FullScreenLoader");

    expect(fullShell).toContain("QueryClientProvider");
    expect(fullShell).toContain("HelmetProvider");
    expect(fullShell).toContain("AccessibilityProvider");
  });

  it("mounts only minimal public overlays after load and browser idle", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const overlays = read("src/app/components/PublicRootOverlays.tsx");

    expect(runtime).toContain("shouldMountOverlays");
    expect(runtime).toContain('document.readyState === "complete"');
    expect(runtime).toContain('window.addEventListener("load", scheduleOverlays');
    expect(runtime).toContain("timeoutMs: 2500");
    expect(runtime).toContain("fallbackDelayMs: 1200");

    expect(overlays).toContain("QueryClientProvider");
    expect(overlays).toContain("<ConsentBanner />");
    expect(overlays).toContain("<Toaster />");
    expect(overlays).not.toContain("GlobalOverlays");
    expect(overlays).not.toContain("OfflineIndicator");
    expect(overlays).not.toContain("Sonner");
  });

  it("discovers the font and map host before runtime work begins", () => {
    const html = read("index.html");

    expect(html).toContain('rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans');
    expect(html).toContain('rel="preconnect" href="https://tiles.openfreemap.org" crossorigin');
    expect(html).toContain('rel="dns-prefetch" href="//tiles.openfreemap.org"');
  });

  it("keeps AdSense off load-critical work and schedules it on browser idle", () => {
    const html = read("index.html");
    const bootstrap = read("public/adsense-bootstrap.js");

    expect(html).toContain('<script src="/adsense-bootstrap.js" defer></script>');
    expect(bootstrap).toContain("scheduleAds");
    expect(bootstrap).toContain('"requestIdleCallback" in window');
    expect(bootstrap).toContain("timeout: 2500");
    expect(bootstrap).toContain("window.setTimeout(loadAds, 1200)");
    expect(bootstrap).toContain('window.addEventListener("load", scheduleAds');
    expect(bootstrap).toContain("ads.async = true");
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
    const lazyAdapter = read(
      "src/core/maps/components/v3/LazyMapLibreAdapter.tsx",
    );
    const workerRuntime = read(
      "src/core/maps/config/maplibreWorkerRuntime.ts",
    );

    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).not.toContain("CapabilityPreviewService");
    expect(main).not.toContain("setupDefaultProviders");
    expect(main).not.toContain("maplibreWorkerRuntime");

    expect(fullShell).toContain("CapabilityPreviewService");
    expect(fullShell).toContain("setupDefaultProviders");
    expect(fullShell).toContain('import("@/core/maps/config/maplibreWorkerRuntime")');
    expect(lazyAdapter).toContain('import("../../config/maplibreWorkerRuntime")');
    expect(lazyAdapter).toContain('import("./MapLibreAdapter")');
    expect(workerRuntime).toContain('from "maplibre-gl"');
    expect(workerRuntime).toContain("workerConfigured");
  });
});
