import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
const prefetch = read("src/app/routes/prefetch.ts");

describe("G6 Community feed main page ownership", () => {
  it("owns ComunidadePage and its deep-link spec only in community-feed", () => {
    const canonical = read("src/core/community-feed/pages/ComunidadePage.tsx");
    expect(canonical.length).toBeGreaterThan(5000);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/ComunidadePage.tsx"))).toBe(false);
    expect(existsSync(resolve(ROOT, "src/core/community-feed/pages/ComunidadePage.publicDeepLink.spec.tsx"))).toBe(true);
    expect(existsSync(resolve(ROOT, "src/core/community/pages/ComunidadePage.publicDeepLink.spec.tsx"))).toBe(false);
    expect(existsSync(resolve(ROOT, "src/app/pages/TerritoryFeedPage.tsx"))).toBe(false);
  });

  it("preserves the canonical community-feed owner outside the active public graph", () => {
    const canonicalImport = "@/core/community-feed/pages/ComunidadePage";
    expect(activeLazyImports).not.toContain("ComunidadePage");
    expect(prefetch).not.toContain(canonicalImport);
    expect(activeLazyImports).not.toContain("TerritoryFeedPage");
    expect(prefetch).not.toContain("TerritoryFeedPage");
  });

  it("uses explicit access ownership and no location-dependent relative imports", () => {
    const canonical = read("src/core/community-feed/pages/ComunidadePage.tsx");
    expect(canonical).toContain("@/core/community-experience/access");
    expect(canonical).not.toContain('from "@/core/community/access"');
    expect(canonical).not.toContain('from "../');
  });
});
