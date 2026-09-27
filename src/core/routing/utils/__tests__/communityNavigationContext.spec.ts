import { describe, expect, it } from "vitest";
import {
  buildCommunityNavigationModuleUrls,
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
  it("resolves Community only inside the canonical territorial hierarchy", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/ba/salvador/santa-cruz/comunidade",
    });

    expect(context).toMatchObject({
      state: "ba",
      city: "salvador",
      territorySlug: "santa-cruz",
      territoryBasePath: "/ba/salvador/santa-cruz",
      basePath: "/ba/salvador/santa-cruz/comunidade",
      groupId: null,
    });
  });

  it("builds sibling module URLs from the same territory", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/ba/salvador/santa-cruz/comunidade/feed",
    });

    expect(context).not.toBeNull();
    expect(buildCommunityNavigationModuleUrls(context!).business).toBe(
      "/ba/salvador/santa-cruz/empresas",
    );
    expect(buildCommunityNavigationModuleUrls(context!).gastronomy).toBe(
      "/ba/salvador/santa-cruz/gastronomia",
    );
    expect(buildCommunityNavigationModuleUrls(context!).jobs).toBe(
      "/ba/salvador/santa-cruz/vagas",
    );
    expect(buildCommunityNavigationModuleUrls(context!).map).toBe(
      "/ba/salvador/santa-cruz/mapa",
    );
  });

  it("derives the canonical territory from a resolved territorial context", () => {
    const context = resolveCommunityNavigationContext({
      pathname: "/qualquer-rota-interna",
      territorialContext: {
        resolved: { kind: "location", location: district as never },
        baseUrl: "/ba/salvador/santa-cruz",
        communityBaseUrl: "/ba/salvador/santa-cruz/comunidade",
      },
    });

    expect(context).toMatchObject({
      territoryBasePath: "/ba/salvador/santa-cruz",
      basePath: "/ba/salvador/santa-cruz/comunidade",
      groupId: null,
    });
  });

  it("does not resolve retired alias or module-first Community paths", () => {
    expect(
      resolveCommunityNavigationContext({
        pathname: "/comunidade/santa-cruz",
      }),
    ).toBeNull();

    expect(
      resolveCommunityNavigationContext({
        pathname: "/comunidade/ba/salvador/santa-cruz",
      }),
    ).toBeNull();
  });
});
