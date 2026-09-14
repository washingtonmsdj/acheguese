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

  it("keeps AdSense off the parser and first-load critical path", () => {
    const html = read("index.html");
    const bootstrap = read("public/adsense-bootstrap.js");

    expect(html).toContain('<script src="/adsense-bootstrap.js" defer></script>');
    expect(bootstrap).toContain('window.addEventListener("load", loadAds');
    expect(bootstrap).toContain("ads.async = true");
  });

  it("keeps MapLibre and its worker behind dynamic runtime loading", () => {
    const main = read("src/main.tsx");
    const lazyAdapter = read(
      "src/core/maps/components/v3/LazyMapLibreAdapter.tsx",
    );
    const workerRuntime = read(
      "src/core/maps/config/maplibreWorkerRuntime.ts",
    );

    expect(main).not.toContain('from "maplibre-gl"');
    expect(main).toContain('import("@/core/maps/config/maplibreWorkerRuntime")');
    expect(lazyAdapter).toContain('import("../../config/maplibreWorkerRuntime")');
    expect(lazyAdapter).toContain('import("./MapLibreAdapter")');
    expect(workerRuntime).toContain('from "maplibre-gl"');
    expect(workerRuntime).toContain("workerConfigured");
  });
});
