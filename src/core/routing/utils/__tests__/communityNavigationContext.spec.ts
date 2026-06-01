import { describe, expect, it } from "vitest";
import {
  buildCommunityNavigationModuleUrls,
  getCommunityAliasCandidateFromPath,
  resolveCommunityNavigationContext,
} from "../communityNavigationContext";

const district = {
  id: "district-1",
  name: "Santa Cruz",
  slug: "santa-cruz",
  type: "district",
  parent_id: "city-1",
  geographic_path: "/br/ba/salvador/santa-cruz",
  status: "active",
  metadata: {},
};

describe("communityNavigationContext", () => {
  it("uses short community alias as base for embedded module links", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/santa-cruz/empresas",
      aliasResolution: {
        status: "resolved",
        alias: "santa-cruz",
        canonicalPath: "/comunidade/ba/salvador/santa-cruz",
        publicTerritoryPath: "/ba/salvador/santa-cruz",
        resolved: { kind: "location", location: district as never },
      },
    });

    expect(context).toMatchObject({
      state: "ba",
      city: "salvador",
      territorySlug: "santa-cruz",
      territoryBasePath: "/ba/salvador/santa-cruz",
      basePath: "/santa-cruz",
      groupId: null,
      usesEmbeddedCommunityModules: true,
    });

    expect(buildCommunityNavigationModuleUrls(context!).business).toBe(
      "/santa-cruz/empresas",
    );
    expect(buildCommunityNavigationModuleUrls(context!).gastronomy).toBe(
      "/santa-cruz/gastronomia",
    );
    expect(buildCommunityNavigationModuleUrls(context!).jobs).toBe(
      "/santa-cruz/vagas",
    );
  });

  it("uses territorial fallback links when only the legacy community path is known", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/comunidade/ba/salvador/santa-cruz/empresas",
    });

    expect(context).toMatchObject({
      territoryBasePath: "/ba/salvador/santa-cruz",
      basePath: "/comunidade/ba/salvador/santa-cruz",
      usesEmbeddedCommunityModules: false,
    });

    expect(buildCommunityNavigationModuleUrls(context!).business).toBe(
      "/empresas/ba/salvador/santa-cruz",
    );
  });

  it("does not treat reserved root paths as community aliases", () => {
    expect(getCommunityAliasCandidateFromPath("/empresas/ba/salvador")).toBeNull();
    expect(getCommunityAliasCandidateFromPath("/p/padaria-do-joao")).toBeNull();
    expect(getCommunityAliasCandidateFromPath("/santa-cruz/empresas")).toBe(
      "santa-cruz",
    );
  });
});
