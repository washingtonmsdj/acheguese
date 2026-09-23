import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CANONICAL_PAGE =
  "src/modules/classifieds/pages/ClassificadosPage.tsx";
const RETIRED_PARALLEL_FILES = [
  "src/modules/classifieds/pages/ClassificadosLandingPage.tsx",
  "src/modules/classifieds/pages/ClassificadosLandingPageSections.tsx",
  "src/modules/classifieds/components/ClassificadosHeader.tsx",
  "src/modules/classifieds/components/filters/AdvancedFilters.tsx",
] as const;

const activeLazyImports = readFileSync("src/app/routes/activeLazyImports.ts", "utf8");
const appLayoutRoutes = readFileSync(
  "src/app/routes/sections/AppLayoutRoutes.tsx",
  "utf8",
);

describe("classifieds public page ownership", () => {
  it("keeps a single canonical public implementation", () => {
    expect(existsSync(CANONICAL_PAGE)).toBe(true);

    for (const retiredPath of RETIRED_PARALLEL_FILES) {
      expect(existsSync(retiredPath)).toBe(false);
    }
  });

  it("preserves ClassificadosPage outside the active public graph", () => {
    expect(activeLazyImports).not.toContain("ClassificadosPage");
    expect(appLayoutRoutes).not.toContain('path="/classificados"');
    expect(activeLazyImports).not.toContain("ClassificadosLandingPage");
  });
});
