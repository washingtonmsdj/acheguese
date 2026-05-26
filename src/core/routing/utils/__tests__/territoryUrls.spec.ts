import { describe, expect, it } from "vitest";

import {
  MODULE_SLUGS,
  buildGroupModuleUrl,
  buildLocationModuleUrl,
  buildModuleTerritoryUrl,
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
