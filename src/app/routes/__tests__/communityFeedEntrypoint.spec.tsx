import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("community feed post-MVP preservation", () => {
  it("preserves the canonical owner without a disconnected public route tree", () => {
    expect(
      existsSync(resolve(ROOT, "src/core/community-feed/pages/ComunidadePage.tsx")),
    ).toBe(true);
    expect(
      existsSync(
        resolve(ROOT, "src/app/routes/territorial/TerritorialModulePages.tsx"),
      ),
    ).toBe(false);

    const activeLazy = read("src/app/routes/activeLazyImports.ts");
    const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const prefetch = read("src/app/routes/prefetch.ts");

    expect(activeLazy).not.toContain("ComunidadePage");
    expect(appRoutes).not.toContain('path="/comunidade"');
    expect(prefetch).not.toContain("@/core/community-feed/pages/ComunidadePage");
  });

  it("keeps the deep-link contract owned by the preserved Community bounded context", () => {
    expect(
      existsSync(
        resolve(
          ROOT,
          "src/core/community-feed/pages/ComunidadePage.publicDeepLink.spec.tsx",
        ),
      ),
    ).toBe(true);

    const owner = read("src/core/community-feed/pages/ComunidadePage.tsx");
    expect(owner).toContain("useModuleTerritoryFilter(");
    expect(owner).toContain("routeResolved: resolved");
  });
});
