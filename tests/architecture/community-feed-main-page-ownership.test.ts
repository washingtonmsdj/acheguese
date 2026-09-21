import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const lazyImports = read("src/app/routes/lazyImports.ts");
const prefetch = read("src/app/routes/prefetch.ts");
const territorialModules = read("src/app/routes/territorial/TerritorialModulePages.tsx");

describe("G6 Community feed main page ownership", () => {
  it("owns ComunidadePage and its deep-link spec only in community-feed", () => {
    const canonical = read("src/core/community-feed/pages/ComunidadePage.tsx");
    expect(canonical.length).toBeGreaterThan(5000);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/ComunidadePage.tsx"))).toBe(false);
    expect(existsSync(resolve(ROOT, "src/core/community-feed/pages/ComunidadePage.publicDeepLink.spec.tsx"))).toBe(true);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/ComunidadePage.publicDeepLink.spec.tsx"))).toBe(false);
    expect(existsSync(resolve(ROOT, "src/app/pages/TerritoryFeedPage.tsx"))).toBe(false);
  });

  it("routes and prefetches the canonical community-feed owner directly", () => {
    const canonicalImport = "@/core/community-feed/pages/ComunidadePage";
    expect(lazyImports).toContain(canonicalImport);
    expect(prefetch).toContain(canonicalImport);
    expect(territorialModules).toContain(canonicalImport);
    expect(lazyImports).not.toContain("TerritoryFeedPage");
    expect(prefetch).not.toContain("TerritoryFeedPage");
    expect(territorialModules).not.toContain("TerritoryFeedPage");
  });

  it("uses explicit access ownership and no location-dependent relative imports", () => {
    const canonical = read("src/core/community-feed/pages/ComunidadePage.tsx");
    expect(canonical).toContain("@/core/community-experience/access");
    expect(canonical).not.toContain('from "@/core/community/access"');
    expect(canonical).not.toContain('from "../');
  });
});
