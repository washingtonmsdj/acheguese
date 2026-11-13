import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Achegue-se public app routing boundary", () => {
  it("serves the Achegue-se application at root and visitor routes", () => {
    const rootEntry = read("src/app/routes/RootRouteEntry.tsx");
    const entryPage = read("src/app/pages/TerritoryEntryPage.tsx");
    const config = JSON.parse(read("vercel.json")) as {
      redirects?: Array<{ source?: string; destination?: string; permanent?: boolean }>;
      rewrites?: Array<{ source?: string; destination?: string }>;
    };

    expect(rootEntry).toContain("return <TerritoryEntryPage />");
    expect(rootEntry).not.toContain("window.location");
    expect(config.redirects ?? []).toEqual([]);
    expect(config.rewrites).toEqual([
      { source: "/(.*)", destination: "/index.html" },
    ]);

    for (const source of [JSON.stringify(config), entryPage]) {
      expect(source).not.toMatch(
        /tonecosstudios|catalogo-api|tonecosstudio|washingtonmsdj\.github\.io\/catalogo/i,
      );
    }
  });

  it("keeps generated Vercel routing first-party", () => {
    const generator = read("tools/security/generate-vercel-config.ts");

    expect(generator).not.toContain("PUBLIC_EXTERNAL_APPS");
    expect(generator).toContain("redirects: []");
    expect(generator).toContain('source: "/(.*)"');
    expect(generator).toContain('destination: "/index.html"');
    expect(generator).toContain(
      "Achegue-se public app must not redirect visitor routes",
    );
  });

  it("does not publish an external catalog through the Achegue-se sitemap", () => {
    const sitemap = read("src/core/routing/seo/generateSitemap.ts");

    expect(sitemap).not.toContain("PUBLIC_CATALOG_PATH");
    expect(sitemap).not.toMatch(/tonecos|catalogo-api/i);
  });

  it("retires the temporary external-app routing owner", () => {
    expect(
      existsSync(resolve(root, "src/shared/config/publicExternalApps.config.ts")),
    ).toBe(false);
  });
});
