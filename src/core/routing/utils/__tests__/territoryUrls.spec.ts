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

  it("rejeita query, hash, backslash, traversal e separadores codificados no territorio", () => {
    for (const unsafePath of [
      "/br/ba/salvador/pituba?next=/admin",
      "/br/ba/salvador/pituba#admin",
      "/br/ba/salvador/pituba\\admin",
      "/br/ba/salvador/%2fadmin",
      "/br/ba/salvador/%252fadmin",
      "/br/ba/salvador/..",
    ]) {
      expect(() => normalizePublicTerritoryPath(unsafePath)).toThrow(
        "segmento territorial",
      );
    }
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
    for (const unsafeSlug of [
      "",
      "cafe/extra",
      "cafe?tab=menu",
      "cafe\\admin",
      "cafe%2Fadmin",
      "cafe%252Fadmin",
      "..",
    ]) {
      expect(() =>
        buildModuleTerritoryEntityUrl(
          MODULE_SLUGS.business,
          "/ba/salvador/pituba",
          unsafeSlug,
        ),
      ).toThrow("segmento de URL seguro");
    }
  });

  it("rejeita slug territorial de grupo que tenta alterar a estrutura da rota", () => {
    expect(() =>
      buildGroupModuleUrl(
        { slug: "../admin" } as never,
        "/br/ba/salvador",
        MODULE_SLUGS.business,
      ),
    ).toThrow("slug do grupo territorial");
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
      buildGroupModuleUrl(
        group,
        "/br/ba/salvador/nordeste-de-amaralina",
        MODULE_SLUGS.business,
      ),
    ).toBe("/ba/salvador/complexo-nordeste/empresas");
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
    ).toThrow("segmento de URL seguro");
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