import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());

function read(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

describe("public catalog mount boundary", () => {
  it("keeps the Achegue-se root owned by TerritoryEntryPage and only announces the catalog", () => {
    const rootEntry = read("src/app/routes/RootRouteEntry.tsx");
    const entryPage = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(rootEntry).toContain("return <TerritoryEntryPage />");
    expect(rootEntry).not.toContain('window.location');
    expect(rootEntry).not.toContain('"/catalogo/"');
    expect(entryPage).toContain("PUBLIC_CATALOG_ANNOUNCEMENT_ENABLED");
    expect(entryPage).toContain("PUBLIC_CATALOG_PATH");
    expect(entryPage).toContain("Pré-lançamento");
    expect(entryPage).toContain("Abrir catálogo");
    expect(entryPage).toContain('href="#conteudo"');
    expect(entryPage).toContain("Conhecer o Achegue-se");
  });

  it("mounts catalog rewrites before the SPA catch-all", () => {
    const config = JSON.parse(read("vercel.json")) as {
      redirects?: Array<{ source?: string; destination?: string; permanent?: boolean }>;
      rewrites?: Array<{ source?: string; destination?: string }>;
    };
    expect(config.redirects).toEqual([
      {
        source: "/catalogo",
        destination: "/catalogo/",
        permanent: true,
      },
    ]);
    expect(config.rewrites).toEqual([
      {
        source: "/catalogo-api/:path*",
        destination: "https://tonecos-catalogo-api.ordax-ac1ca1b50d09.workers.dev/:path*",
      },
      {
        source: "/catalogo/",
        destination: "https://washingtonmsdj.github.io/catalogo/",
      },
      {
        source: "/catalogo/:path*",
        destination: "https://washingtonmsdj.github.io/catalogo/:path*",
      },
      {
        source: "/(.*)",
        destination: "/index.html",
      },
    ]);
  });

  it("publishes the catalog path through the canonical sitemap", () => {
    const sitemap = read("src/core/routing/seo/generateSitemap.ts");
    expect(sitemap).toContain("PUBLIC_CATALOG_PATH");
    expect(sitemap).toContain("changefreq: 'weekly'");
  });

  it("keeps the temporary catalog announcement reversible by public config", () => {
    const config = read("src/shared/config/publicExternalApps.config.ts");
    expect(config).toContain("VITE_PUBLIC_CATALOG_ANNOUNCEMENT");
    expect(config).toContain('?? "true"');
    expect(config).toContain("PUBLIC_CATALOG_PATH");
  });

  it("keeps routing generated from the public external apps SSOT", () => {
    const source = read("tools/security/generate-vercel-config.ts");
    expect(source).toContain("PUBLIC_EXTERNAL_APPS");
    expect(source).toContain("Public catalog rewrites drifted from publicExternalApps SSOT");
  });

  it("keeps the browser CSP first-party for catalog API traffic", () => {
    const security = read("src/shared/config/security.config.ts");
    expect(security).not.toContain("CATALOG_API");
    expect(security).not.toContain("tonecos-catalogo-api.ordax-ac1ca1b50d09.workers.dev");
    expect(security).toContain("'connect-src': [");
    expect(security).toContain("\"'self'\"");
  });
});
