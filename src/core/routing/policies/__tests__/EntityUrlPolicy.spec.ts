import { describe, expect, it } from "vitest";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  buildCommunityPortalUrl,
  buildCommunityScopedEntityUrl,
  buildPublicEntityUrl,
  decideCommunityEntityRoute,
} from "../EntityUrlPolicy";

describe("EntityUrlPolicy", () => {
  it("builds public entity URLs outside the community portal", () => {
    expect(
      buildPublicEntityUrl({
        module: APP_MODULE_SLUGS.business,
        geographicPath: "/br/ba/salvador/pituba",
        slug: "padaria-x",
      }),
    ).toBe("/empresas/ba/salvador/pituba/padaria-x");
  });

  it("builds explicit community portal URLs", () => {
    expect(buildCommunityPortalUrl("santa-cruz")).toBe("/comunidade/santa-cruz");
    expect(buildCommunityPortalUrl("santa-cruz", "feed")).toBe(
      "/comunidade/santa-cruz/feed",
    );
  });

  it("builds community scoped entity URLs only with explicit alias", () => {
    expect(
      buildCommunityScopedEntityUrl({
        communityAlias: "santa-cruz",
        module: APP_MODULE_SLUGS.business,
        slug: "padaria-x",
      }),
    ).toBe("/comunidade/santa-cruz/empresas/padaria-x");
  });

  it("rejects non-canonical community-scoped aliases without redirects", () => {
    expect(
      decideCommunityEntityRoute({
        currentPath: "/comunidade/santa-cruz-antigo/empresas/padaria-x",
        targetPath: "/comunidade/santa-cruz/empresas/padaria-x",
      }),
    ).toEqual({
      intent: "not_found",
      targetPath: "/comunidade/santa-cruz/empresas/padaria-x",
      reason: "non_canonical_community_entity_path",
    });

    expect(
      decideCommunityEntityRoute({
        currentPath: "/comunidade/santa-cruz/empresas/padaria-x",
        targetPath: "/comunidade/santa-cruz/empresas/padaria-x",
      }),
    ).toEqual({
      intent: "render",
      targetPath: "/comunidade/santa-cruz/empresas/padaria-x",
    });
  });
});
