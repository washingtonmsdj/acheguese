import { describe, expect, it } from "vitest";

import {
  MODULE_SLUGS,
  buildGroupModuleUrl,
  buildLocationModuleUrl,
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
  buildModuleTerritoryUrlFromSegments,
  buildTerritoryModuleUrl,
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
