import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { generateSitemap } from "../generateSitemap";

describe("generateSitemap", () => {
  it("gera URLs comunitarias curtas sem legado /area/", () => {
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
    expect(sitemap).not.toContain("https://acheguese.com.br/comunidade/");
    expect(sitemap).not.toContain(
      "https://acheguese.com.br/ba/salvador/chapada-do-rio-vermelho",
    );
    expect(sitemap).not.toContain(
      "https://acheguese.com.br/empresas/ba/salvador/chapada-do-rio-vermelho",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/chapada-do-rio-vermelho",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/chapada-do-rio-vermelho/empresas",
    );
    expect(sitemap).toContain(
      "https://acheguese.com.br/complexo-do-nordeste-de-amaralina/feed",
    );
  });

  it("mantem artefatos publicos sem URLs legadas de comunidade", () => {
    const publicArtifacts = [
      readFileSync("public/sitemap.xml", "utf8"),
      readFileSync("public/manifest.json", "utf8"),
    ].join("\n");

    expect(publicArtifacts).not.toContain("/area/");
    expect(publicArtifacts).not.toContain("http://localhost");
    expect(publicArtifacts).not.toContain("https://acheguese.com.br/comunidade/");
    expect(publicArtifacts).toContain(
      "https://acheguese.com.br/complexo-do-nordeste-de-amaralina/feed",
    );
  });
});
