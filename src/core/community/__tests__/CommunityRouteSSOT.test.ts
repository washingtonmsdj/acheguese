import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("community route SSOT", () => {
  it("keeps city-level community routes canonical and generated from routing SSOT", () => {
    const routes = readFileSync("src/app/routes/AppRoutes.tsx", "utf8");

    expect(routes).toContain("buildCommunityTerritoryRoutePath");
    expect(routes).toContain("CommunityTerritorialShell");
    expect(routes).not.toContain("buildCommunityLegacyAreaRoutePath");
    expect(routes).not.toContain("CommunityAreaCanonicalRedirect");
    expect(routes).not.toContain('path="/comunidade/:state/:city/:territorySlug"');
  });
});
