import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("public federated search route", () => {
  it("keeps public navigation and SEO pointing to /busca", () => {
    const sidebar = readProjectFile("src/app/components/navigation/AppSidebar.tsx");
    const navigationConfig = readProjectFile("src/app/components/navigation/navigation.config.ts");
    const appUrls = readProjectFile("src/core/routing/hooks/useAppUrls.ts");
    const jsonLd = readProjectFile("src/shared/utils/seo/jsonLd.ts");

    expect(sidebar).toContain("buildModuleTerritoryUrl(MODULE_SLUGS.search");
    expect(sidebar).not.toContain("`/buscar${activeCityBase}`");
    expect(sidebar).not.toContain("`/buscar/${communityContext.state}");
    expect(navigationConfig).toContain("href: '/busca'");
    expect(appUrls).toContain("search: buildModuleTerritoryUrl(MODULE_SLUGS.search, cityBase)");
    expect(jsonLd).toContain("/busca?q={search_term_string}");
  });
});
