import { describe, expect, it } from "vitest";

import {
  MODULE_SLUGS,
  buildCommunityScopedUrl,
  buildCommunityTabUrlFromPath,
  buildCommunityTerritoryUrl,
  buildGroupModuleUrl,
  buildLocationModuleUrl,
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
  buildPublicTerritoryBaseUrlFromInput,
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

describe("buildPublicTerritoryBaseUrlFromInput", () => {
  it("resolve nome ou sigla de estado pelo SSOT e normaliza cidade/territorio", () => {
    expect(
      buildPublicTerritoryBaseUrlFromInput(
        "Bahia",
        "Salvador",
        "Nordeste de Amaralina",
      ),
    ).toBe("/ba/salvador/nordeste-de-amaralina");

    expect(
      buildPublicTerritoryBaseUrlFromInput("SP", "São Paulo"),
    ).toBe("/sp/sao-paulo");
  });

  it("rejeita estado ou cidade invalidos em vez de produzir rota incorreta", () => {
    expect(() =>
      buildPublicTerritoryBaseUrlFromInput("Estado inexistente", "Cidade"),
    ).toThrow("estado brasileiro valido");

    expect(() =>
      buildPublicTerritoryBaseUrlFromInput("BA", "   "),
    ).toThrow("cidade valida");
  });
});

describe("territory-first module urls", () => {
  const location = {
    geographic_path: "/br/ba/salvador/pituba",
  } as never;

  const group = {
    slug: "complexo-nordeste",
  } as never;

  it("monta territorio antes do modulo", () => {
    expect(buildModuleTerritoryUrl(MODULE_SLUGS.business, "/ba/salvador")).toBe(
      "/ba/salvador/empresas",
    );
    expect(
      buildModuleTerritoryUrl(MODULE_SLUGS.services, "/br/ba/salvador/pituba"),
    ).toBe("/ba/salvador/pituba/servicos");
  });

  it("monta listagem e detalhe a partir do mesmo SSOT territorial", () => {
    expect(
      buildModuleTerritoryUrlFromSegments(
        MODULE_SLUGS.education,
        "ba",
        "salvador",
      ),
    ).toBe("/ba/salvador/educacao");
    expect(
      buildModuleTerritoryUrlFromSegments(
        MODULE_SLUGS.education,
        "ba",
        "salvador",
        ["pituba"],
      ),
    ).toBe("/ba/salvador/pituba/educacao");
    expect(
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.business,
        "/br/ba/salvador/rio-vermelho",
        "cafe-central",
      ),
    ).toBe("/ba/salvador/rio-vermelho/empresas/cafe-central");
  });

  it("rejeita slug de entidade vazio ou com separadores de rota", () => {
    expect(() =>
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.business,
        "/ba/salvador/pituba",
        "",
      ),
    ).toThrow("segmento unico");
    expect(() =>
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.business,
        "/ba/salvador/pituba",
        "cafe/extra",
      ),
    ).toThrow("segmento unico");
    expect(() =>
      buildModuleTerritoryEntityUrl(
        MODULE_SLUGS.business,
        "/ba/salvador/pituba",
        "cafe?tab=menu",
      ),
    ).toThrow("segmento unico");
  });

  it("mantem builders especializados alinhados ao territorio primeiro", () => {
    expect(buildLocationModuleUrl(location, MODULE_SLUGS.business)).toBe(
      "/ba/salvador/pituba/empresas",
    );
    expect(
      buildGroupModuleUrl(
        group,
        "/br/ba/salvador",
        MODULE_SLUGS.classifieds,
      ),
    ).toBe("/ba/salvador/complexo-nordeste/classificados");
    expect(
      buildTerritoryModuleUrl(
        { kind: "location", location },
        MODULE_SLUGS.gastronomy,
      ),
    ).toBe("/ba/salvador/pituba/gastronomia");
  });
});

describe("community territory urls", () => {
  it("preserva cidade, bairro ou grupo antes do modulo comunidade", () => {
    expect(buildCommunityTerritoryUrl("/ba/salvador")).toBe(
      "/ba/salvador/comunidade",
    );
    expect(
      buildCommunityTerritoryUrl("/ba/salvador/chapada-do-rio-vermelho"),
    ).toBe("/ba/salvador/chapada-do-rio-vermelho/comunidade");
    expect(
      buildCommunityTerritoryUrl(
        "/ba/salvador/complexo-do-nordeste-de-amaralina",
        "feed",
      ),
    ).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade/feed",
    );
  });

  it("gera abas sociais preservando o escopo territorial atual", () => {
    expect(
      buildCommunityTabUrlFromPath(
        "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
        "feed",
      ),
    ).toBe(
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade/feed",
    );
  });

  it("monta subrotas dentro da base territorial da comunidade", () => {
    expect(
      buildCommunityScopedUrl(
        "/ba/salvador/nordeste-de-amaralina/comunidade",
        "feed",
      ),
    ).toBe("/ba/salvador/nordeste-de-amaralina/comunidade/feed");
    expect(
      buildCommunityScopedUrl(
        "/ba/salvador/nordeste-de-amaralina/comunidade",
      ),
    ).toBe("/ba/salvador/nordeste-de-amaralina/comunidade");
    expect(() =>
      buildCommunityScopedUrl(
        "/ba/salvador/nordeste-de-amaralina/comunidade",
        "feed?tab=x",
      ),
    ).toThrow("segmento de URL");
  });

  it("extrai o territorio sem confundir o modulo comunidade com o slug", () => {
    expect(
      extractCommunityTerritoryBaseUrl("/ba/salvador/comunidade"),
    ).toBe("/ba/salvador");
    expect(
      extractCommunityTerritoryBaseUrl("/ba/salvador/comunidade/feed"),
    ).toBe("/ba/salvador");
    expect(
      extractCommunityTerritoryBaseUrl(
        "/ba/salvador/chapada-do-rio-vermelho/comunidade/feed",
      ),
    ).toBe("/ba/salvador/chapada-do-rio-vermelho");
    expect(
      extractCommunityTerritoryBaseUrl("/comunidade/santa-cruz"),
    ).toBeNull();
  });
});
