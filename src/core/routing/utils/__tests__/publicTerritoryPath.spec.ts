import { describe, expect, it } from "vitest";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";
import { parsePublicTerritoryPath } from "../publicTerritoryPath";

describe("parsePublicTerritoryPath", () => {
  it.each([
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.feed,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.interest,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.issues,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.communication,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.groups,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.lostAndFound,
    APP_MODULE_SLUGS.business,
    APP_MODULE_SLUGS.services,
    APP_MODULE_SLUGS.classifieds,
    APP_MODULE_SLUGS.gastronomy,
    APP_MODULE_SLUGS.events,
  ])("does not treat the static community segment %s as a territory", (segment) => {
    expect(
      parsePublicTerritoryPath(`/comunidade/ba/salvador/${segment}`),
    ).toEqual({
      state: "ba",
      city: "salvador",
      territorySlug: undefined,
    });
  });

  it("keeps a real scoped territory before the feed suffix", () => {
    expect(
      parsePublicTerritoryPath("/comunidade/ba/salvador/pituba/feed"),
    ).toEqual({
      state: "ba",
      city: "salvador",
      territorySlug: "pituba",
    });
  });

  it("keeps a real scoped territory on its overview route", () => {
    expect(parsePublicTerritoryPath("/comunidade/ba/salvador/pituba")).toEqual({
      state: "ba",
      city: "salvador",
      territorySlug: "pituba",
    });
  });
});
