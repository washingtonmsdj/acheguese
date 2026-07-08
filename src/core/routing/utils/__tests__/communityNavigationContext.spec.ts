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
  it("uses explicit community alias as base for embedded module links", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/comunidade/santa-cruz/empresas",
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
      basePath: "/comunidade/santa-cruz",
      groupId: null,
      usesEmbeddedCommunityModules: true,
    });

    expect(buildCommunityNavigationModuleUrls(context!).business).toBe(
      "/comunidade/santa-cruz/empresas",
    );
    expect(buildCommunityNavigationModuleUrls(context!).gastronomy).toBe(
      "/comunidade/santa-cruz/gastronomia",
    );
    expect(buildCommunityNavigationModuleUrls(context!).jobs).toBe(
      "/comunidade/santa-cruz/vagas",
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

  it("uses explicit community portal links from territorial context", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/comunidade/santa-cruz/empresas",
      territorialContext: {
        resolved: { kind: "location", location: district as never },
        baseUrl: "/ba/salvador/santa-cruz",
        communityBaseUrl: "/comunidade/santa-cruz",
      },
    });

    expect(context).toMatchObject({
      territoryBasePath: "/ba/salvador/santa-cruz",
      basePath: "/comunidade/santa-cruz",
      usesEmbeddedCommunityModules: true,
    });

    expect(buildCommunityNavigationModuleUrls(context!).business).toBe(
      "/comunidade/santa-cruz/empresas",
    );
    expect(buildCommunityNavigationModuleUrls(context!).gastronomy).toBe(
      "/comunidade/santa-cruz/gastronomia",
    );
  });

  it("does not treat reserved root paths as community aliases", () => {
    expect(getCommunityAliasCandidateFromPath("/empresas/ba/salvador")).toBeNull();
    expect(getCommunityAliasCandidateFromPath("/p/padaria-do-joao")).toBeNull();
    expect(getCommunityAliasCandidateFromPath("/santa-cruz/empresas")).toBeNull();
    expect(getCommunityAliasCandidateFromPath("/comunidade/ba/salvador")).toBeNull();
    expect(getCommunityAliasCandidateFromPath("/comunidade/santa-cruz/empresas")).toBe(
      "santa-cruz",
    );
  });
});
