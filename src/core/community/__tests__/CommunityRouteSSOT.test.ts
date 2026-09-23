import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("community route SSOT", () => {
  it("preserves canonical Community route patterns without a disconnected route tree", () => {
    const patterns = readFileSync(
      "src/core/routing/config/territorialRoutePatterns.ts",
      "utf8",
    );
    const registry = readFileSync(
      "src/app/config/productModuleRegistry.ts",
      "utf8",
    );
    const appLayout = readFileSync(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
      "utf8",
    );

    expect(patterns).toContain("buildCommunityTerritoryRoutePath");
    expect(patterns).toContain("buildCommunityAliasRoutePath");
    expect(registry).toMatch(/community:\s*{\s*status:\s*"paused"/);

    expect(
      existsSync("src/core/community-feed/pages/ComunidadePage.tsx"),
    ).toBe(true);
    expect(
      existsSync("src/app/routes/sections/CommunityTerritoryRoutes.tsx"),
    ).toBe(false);

    expect(appLayout).not.toContain("CommunityTerritoryRoutes");
    expect(appLayout).not.toContain("CommunityTerritorialShell");
    expect(appLayout).not.toContain("CommunityPersistentPortalLayout");
    expect(appLayout).not.toContain("CommunityAliasRoute");
    expect(appLayout).not.toContain("buildCommunityLegacyAreaRoutePath");
    expect(appLayout).not.toContain("CommunityAreaCanonicalRedirect");
  });
});
