import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("community route SSOT", () => {
  it("keeps area routes explicit and avoids city-level community as a feed fallback", () => {
    const routes = readFileSync("src/app/routes/AppRoutes.tsx", "utf8");

    expect(routes).toContain("area/:groupSlug");
    expect(routes).toContain("CommunityTerritorialShell");
    expect(routes).not.toContain('path="/comunidade/:state/:city"');
  });
});
