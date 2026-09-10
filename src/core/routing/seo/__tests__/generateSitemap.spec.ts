import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  generateSitemap,
  generateSitemapArtifacts,
  isTransientSitemapSourceError,
  SITEMAP_URL_CHUNK_SIZE,
} from "../generateSitemap";

describe("generateSitemap", () => {
  it("gera URLs publicas canonicas sem portal comunitario nem legado /area/", () => {
    const sitemap = generateSitemap(
      [
        {
          status: "active",
          type: "district",
          geographic_path: "/br/ba/salvador/chapada-do-rio-vermelho",
        },
      ] as never,
      [
        {
          status: "active",
          slug: "complexo-do-nordeste-de-amaralina",
          members: [
            {
              geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
            },
          ],
        },
      ] as never,
      "https://acheguese.com.br",
    );

    expect(sitemap).not.toContain("/area/");
    expect(sitemap).not.toContain("/comunidade/");
    expect(sitemap).toContain(
      "https://acheguese.com.br/ba/salvador/chapada-do-rio-vermelho",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/empresas/ba/salvador/chapada-do-rio-vermelho",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/gastronomia/ba/salvador/chapada-do-rio-vermelho",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/ba/salvador/complexo-do-nordeste-de-amaralina",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/empresas/ba/salvador/complexo-do-nordeste-de-amaralina",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/mapa/ba/salvador/complexo-do-nordeste-de-amaralina",
    );
    expect(sitemap).not.toContain("/mobilidade");
    expect(sitemap).not.toContain("/eventos");
    expect(sitemap).not.toContain("/vagas");
  });

  it("deduplica URLs canonicas quando pagina estatica e territorio convergem", () => {
    const sitemap = generateSitemap(
      [
        {
          status: "active",
          type: "city",
          geographic_path: "/br/ba/salvador",
        },
      ] as never,
      [],
      "https://acheguese.com.br",
    );

    const salvadorLocations =
      sitemap.match(
        /<loc>https:\/\/acheguese\.com\.br\/ba\/salvador<\/loc>/g,
      ) ?? [];

    expect(salvadorLocations).toHaveLength(1);
    expect(sitemap).toMatch(
      /<loc>https:\/\/acheguese\.com\.br\/ba\/salvador<\/loc>\s*<changefreq>daily<\/changefreq>\s*<priority>0\.95<\/priority>/,
    );
  });

  it("particiona inventarios grandes em sitemap index e chunks limitados", () => {
    const artifacts = generateSitemapArtifacts(
      [
        {
          status: "active",
          type: "district",
          geographic_path: "/br/ba/salvador/pituba",
        },
      ] as never,
      [],
      "https://acheguese.com.br",
      5,
    );

    const [root, ...chunks] = artifacts;
    expect(root.filename).toBe("sitemap.xml");
    expect(root.content).toContain("<sitemapindex");
    expect(chunks.length).toBeGreaterThan(1);

    const childReferences =
      root.content.match(
        /<loc>https:\/\/acheguese\.com\.br\/sitemap-\d+\.xml<\/loc>/g,
      ) ?? [];
    expect(childReferences).toHaveLength(chunks.length);

    const urls = chunks.flatMap((chunk) => {
      const chunkUrls = [...chunk.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (match) => match[1],
      );
      expect(chunk.filename).toMatch(/^sitemap-\d+\.xml$/);
      expect(chunk.content).toContain("<urlset");
      expect(chunk.urlCount).toBe(chunkUrls.length);
      expect(chunkUrls.length).toBeLessThanOrEqual(5);
      return chunkUrls;
    });

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain("https://acheguese.com.br/ba/salvador/pituba");
  });

  it("mantem margem abaixo do limite de 50 mil URLs por sitemap", () => {
    expect(SITEMAP_URL_CHUNK_SIZE).toBeLessThanOrEqual(50_000);
    expect(SITEMAP_URL_CHUNK_SIZE).toBeGreaterThan(0);
  });

  it("classifica somente falhas transitorias de rede/upstream como fallback permitido", () => {
    expect(
      isTransientSitemapSourceError(
        new Error("supabase.co | 522: Connection timed out"),
      ),
    ).toBe(true);
    expect(isTransientSitemapSourceError(new Error("fetch failed"))).toBe(true);
    expect(isTransientSitemapSourceError({ message: "HTTP 503 upstream" })).toBe(true);

    expect(
      isTransientSitemapSourceError(new Error("column geographic_path does not exist")),
    ).toBe(false);
    expect(isTransientSitemapSourceError(new Error("Invalid API key"))).toBe(false);
  });

  it("mantem leitura de build do sitemap na projecao territorial minima", () => {
    const generator = readFileSync(
      "src/core/routing/seo/generateSitemap.ts",
      "utf8",
    );
    const releaseScript = readFileSync(
      "tools/release/generate-sitemap.ts",
      "utf8",
    );
    const locationReader = readFileSync(
      "src/core/location/services/LocationsReadService.ts",
      "utf8",
    );

    expect(generator).toContain("getAllCompleteForPublicRouting()");
    expect(generator).not.toContain("LocationsReadService.getAllComplete()");
    expect(generator).toContain("allowTransientSourceFallback");
    expect(generator).toContain("static-fallback");
    expect(releaseScript).toContain('process.env.VERCEL === "1"');
    expect(releaseScript).toContain("SITEMAP_ALLOW_TRANSIENT_SOURCE_FALLBACK");
    expect(locationReader).toContain(
      '"id,type,status,geographic_path,metadata"',
    );
    expect(locationReader).toContain('.in("type", ["city", "district"])');
    expect(locationReader).toContain('.eq("status", "active")');
    expect(locationReader).toContain('.order("geographic_path")');
    expect(locationReader).toContain('.limit(COMPLETE_READ_PAGE_SIZE)');
    expect(locationReader).toContain('.gt("geographic_path", cursor)');
    expect(locationReader).not.toContain(
      '.select(PUBLIC_ROUTING_LOCATION_SELECT, { count: "exact" })',
    );
    expect(locationReader).not.toContain(
      '.range(offset, offset + COMPLETE_READ_PAGE_SIZE - 1)',
    );
  });

  it("mantem artefatos publicos sem URLs legadas de comunidade", () => {
    const publicArtifacts = [
      readFileSync("public/sitemap.xml", "utf8"),
      readFileSync("public/manifest.json", "utf8"),
    ].join("\n");

    expect(publicArtifacts).not.toContain("/area/");
    expect(publicArtifacts).not.toContain("http://localhost");
    expect(publicArtifacts).not.toContain("/comunidade/");
    expect(publicArtifacts).not.toContain("https://acheguese.com.br/mobilidade/");
    expect(publicArtifacts).not.toContain("https://acheguese.com.br/eventos/");
    expect(publicArtifacts).not.toContain("https://acheguese.com.br/vagas/");
    expect(publicArtifacts).not.toContain("https://acheguese.com.br/educacao/");
    expect(publicArtifacts).not.toContain("https://acheguese.com.br/comunicacao/");
  });
});
