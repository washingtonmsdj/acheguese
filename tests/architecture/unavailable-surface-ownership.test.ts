import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const communityRoutes = readFileSync(
  "src/app/routes/sections/CommunityTerritoryRoutes.tsx",
  "utf8",
);
const lazyImports = readFileSync("src/app/routes/lazyImports.ts", "utf8");
const launchPausedFactory = readFileSync(
  "src/app/routes/launchPausedComponent.ts",
  "utf8",
);

describe("unavailable surface ownership", () => {
  it("does not keep the retired TerritoryUnavailablePage alias", () => {
    expect(existsSync("src/app/pages/TerritoryUnavailablePage.tsx")).toBe(false);
    expect(lazyImports).not.toContain("TerritoryUnavailablePage");
  });

  it("keeps coming-soon territory interest and paused modules as separate contracts", () => {
    expect(communityRoutes).toContain(
      "segments: [TERRITORIAL_STATIC.interest]",
    );
    expect(communityRoutes).toContain("element: <P.CommunityInterestPage />");
    expect(communityRoutes).toContain(
      '<P.LaunchPausedPage moduleName={definition.pausedModuleName ?? "Módulo"} />',
    );
    expect(launchPausedFactory).toContain(
      'import LaunchPausedPage from "@/app/pages/LaunchPausedPage"',
    );
    expect(existsSync("src/app/pages/LaunchPausedPage.tsx")).toBe(true);
    expect(
      existsSync("src/core/routing/components/CommunityInterestPage.tsx"),
    ).toBe(true);
  });
});
