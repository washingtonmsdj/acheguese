import { describe, expect, it } from "vitest";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { parsePublicTerritoryPath } from "../publicTerritoryPath";

describe("parsePublicTerritoryPath", () => {
  it.each([
    APP_MODULE_SLUGS.community,
    APP_MODULE_SLUGS.business,
    APP_MODULE_SLUGS.services,
    APP_MODULE_SLUGS.classifieds,
    APP_MODULE_SLUGS.gastronomy,
    APP_MODULE_SLUGS.events,
    APP_MODULE_SLUGS.map,
    APP_MODULE_SLUGS.nearby,
    APP_MODULE_SLUGS.search,
  ])("does not treat the city-level module %s as a territory", (segment) => {
    expect(parsePublicTerritoryPath(`/ba/salvador/${segment}`)).toEqual({
      state: "ba",
      city: "salvador",
      territorySlug: undefined,
    });
  });

  it("keeps a real scoped territory before the community module", () => {
    expect(
      parsePublicTerritoryPath(
        "/ba/salvador/pituba/comunidade/feed",
      ),
    ).toEqual({
      state: "ba",
      city: "salvador",
      territorySlug: "pituba",
    });
  });

  it("keeps a real scoped territory on its overview route", () => {
    expect(parsePublicTerritoryPath("/ba/salvador/pituba")).toEqual({
      state: "ba",
      city: "salvador",
      territorySlug: "pituba",
    });
  });

  it("rejects retired module-first territorial URLs", () => {
    expect(parsePublicTerritoryPath("/mapa/ba/salvador/pituba")).toEqual({});
    expect(parsePublicTerritoryPath("/empresas/ba/salvador/pituba")).toEqual({});
    expect(parsePublicTerritoryPath("/comunidade/ba/salvador/pituba")).toEqual({});
  });
});
