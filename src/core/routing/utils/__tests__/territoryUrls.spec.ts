import { describe, expect, it } from "vitest";

import {
  MODULE_SLUGS,
  buildCommunityAliasUrl,
  buildCommunityTabUrlFromPath,
  buildCommunityTerritoryUrl,
  buildGroupModuleUrl,
  buildLocationModuleUrl,
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
  buildModuleTerritoryUrlFromSegments,
  buildTerritoryModuleUrl,
  extractCommunityTerritoryBaseUrl,
  normalizePublicTerritoryPath,
} from "@/core/routing/utils/territoryUrls";

describe("normalizePublicTerritoryPath", () => {
  it("normaliza geographic_path interno com /br", () => {
    expect(normalizePublicTerritoryPath("/br/ba/salvador/pituba")).toBe(
      "/ba/salvador/pituba",
    );
  });

  it("preserva path publico com barra inicial", () => {
    expect(normalizePublicTerritoryPath("/ba/salvador/pituba")).toBe(
      "/ba/salvador/pituba",
    );
  });

  it("adiciona barra inicial quando o path vier sem slash", () => {
    expect(normalizePublicTerritoryPath("ba/salvador/pituba")).toBe(
      "/ba/salvador/pituba",
    );
  });
});

describe("module-first territory urls", () => {
  const location = {
    geographic_path: "/br/ba/salvador/pituba",
  } as never;

  const group = {
    slug: "complexo-nordeste",
  } as never;

  it("monta modulo antes do territorio para paths publicos e internos", () => {
    expect(buildModuleTerritoryUrl(MODULE_SLUGS.business, "/ba/salvador")).toBe(
      "/empresas/ba/salvador",
    );
    expect(buildModuleTerritoryUrl(MODULE_SLUGS.services, "/br/ba/salvador/pituba")).toBe(
      "/servicos/ba/salvador/pituba",
    );
  });

  it("monta listagem e detalhe a partir do mesmo SSOT territorial", () => {
    expect(
      buildModuleTerritoryUrlFromSegments(MODULE_SLUGS.education, "ba", "salvador"),
    ).toBe("/educacao/ba/salvador");
    expect(
      buildModuleTerritoryUrlFromSegments(MODULE_SLUGS.education, "ba", "salvador", [
        "pituba",
      ]),
    ).toBe("/educacao/ba/salvador/pituba");
    expect(
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.gastronomy,
        "/br/ba/salvador/rio-vermelho",
        "cafe-central",
      ),
    ).toBe("/gastronomia/ba/salvador/rio-vermelho/cafe-central");
  });

  it("rejeita slug de entidade vazio ou com separadores de rota", () => {
    expect(() =>
      buildModuleTerritoryEntityUrl(MODULE_SLUGS.gastronomy, "/ba/salvador/pituba", ""),
    ).toThrow("segmento unico");
    expect(() =>
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.gastronomy,
        "/ba/salvador/pituba",
        "cafe/extra",
      ),
    ).toThrow("segmento unico");
    expect(() =>
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.gastronomy,
        "/ba/salvador/pituba",
        "cafe?tab=menu",
      ),
    ).toThrow("segmento unico");
  });

  it("mantem os builders antigos alinhados ao padrao publico canonico", () => {
    expect(buildLocationModuleUrl(location, MODULE_SLUGS.business)).toBe(
      "/empresas/ba/salvador/pituba",
    );
    expect(buildGroupModuleUrl(group, "/br/ba/salvador", MODULE_SLUGS.classifieds)).toBe(
      "/classificados/ba/salvador/complexo-nordeste",
    );
    expect(
      buildTerritoryModuleUrl(
        { kind: "location", location },
        MODULE_SLUGS.gastronomy,
      ),
    ).toBe("/gastronomia/ba/salvador/pituba");
  });
});

describe("community territory urls", () => {
  it("preserva bairro ou grupo na URL comunitaria canonica", () => {
    expect(buildCommunityTerritoryUrl("/ba/salvador")).toBe(
      "/comunidade/ba/salvador",
    );
    expect(buildCommunityTerritoryUrl("/ba/salvador/chapada-do-rio-vermelho")).toBe(
      "/comunidade/ba/salvador/chapada-do-rio-vermelho",
    );
    expect(
      buildCommunityTerritoryUrl(
        "/ba/salvador/complexo-do-nordeste-de-amaralina",
        "feed",
      ),
    ).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed");
  });

  it("gera abas sociais preservando o escopo territorial atual", () => {
    expect(
      buildCommunityTabUrlFromPath(
        "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
        "feed",
      ),
    ).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed");
  });

  it("monta alias publico curto de comunidade na raiz", () => {
    expect(buildCommunityAliasUrl("santa-cruz")).toBe("/santa-cruz");
    expect(buildCommunityAliasUrl("santa-cruz", "empresas")).toBe(
      "/santa-cruz/empresas",
    );
    expect(() => buildCommunityAliasUrl("santa/cruz")).toThrow("segmento de URL");
  });

  it("extrai o territorio de rotas comunitarias sem confundir modulos com bairro", () => {
    expect(extractCommunityTerritoryBaseUrl("/comunidade/ba/salvador")).toBe(
      "/ba/salvador",
    );
    expect(
      extractCommunityTerritoryBaseUrl("/comunidade/ba/salvador/feed"),
    ).toBe("/ba/salvador");
    expect(
      extractCommunityTerritoryBaseUrl("/comunidade/ba/salvador/empresas"),
    ).toBe("/ba/salvador");
    expect(
      extractCommunityTerritoryBaseUrl("/comunidade/ba/salvador/chapada-do-rio-vermelho/empresas"),
    ).toBe("/ba/salvador/chapada-do-rio-vermelho");
    expect(
      extractCommunityTerritoryBaseUrl("/comunidade/santa-cruz/empresas"),
    ).toBeNull();
  });
});
