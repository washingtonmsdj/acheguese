import { describe, expect, it } from "vitest";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import {
  buildCommunityPortalUrl,
  buildPublicEntityUrl,
} from "../EntityUrlPolicy";

describe("EntityUrlPolicy", () => {
  it("builds public entity URLs under the territory and owning module", () => {
    expect(
      buildPublicEntityUrl({
        module: APP_MODULE_SLUGS.business,
        geographicPath: "/br/ba/salvador/pituba",
        slug: "padaria-x",
      }),
    ).toBe("/ba/salvador/pituba/empresas/padaria-x");
  });

  it("builds Community only as a module inside a territory", () => {
    expect(buildCommunityPortalUrl("/ba/salvador/santa-cruz")).toBe(
      "/ba/salvador/santa-cruz/comunidade",
    );
    expect(
      buildCommunityPortalUrl("/ba/salvador/santa-cruz", "feed"),
    ).toBe("/ba/salvador/santa-cruz/comunidade/feed");
  });

  it("does not expose a policy for community-scoped copies of public entities", () => {
    expect(
      Object.prototype.hasOwnProperty.call(
        { buildCommunityPortalUrl, buildPublicEntityUrl },
        "buildCommunityScopedEntityUrl",
      ),
    ).toBe(false);
  });
});
