import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appLayoutRoutes = readFileSync(
  "src/app/routes/sections/AppLayoutRoutes.tsx",
  "utf8",
);
const activeLazyImports = readFileSync(
  "src/app/routes/activeLazyImports.ts",
  "utf8",
);
const launchPausedFactory = readFileSync(
  "src/app/routes/launchPausedComponent.ts",
  "utf8",
);
const territorialLayout = readFileSync(
  "src/core/routing/components/TerritorialLayout.tsx",
  "utf8",
);

describe("unavailable surface ownership", () => {
  it("does not keep the retired TerritoryUnavailablePage alias", () => {
    expect(existsSync("src/app/pages/TerritoryUnavailablePage.tsx")).toBe(false);
    expect(activeLazyImports).not.toContain("TerritoryUnavailablePage");
  });

  it("keeps paused-module UI outside the active public route graph", () => {
    expect(appLayoutRoutes).not.toContain("LaunchPausedPage");
    expect(appLayoutRoutes).not.toContain("DIRECT_PAUSED_ROUTES");
    expect(appLayoutRoutes).not.toContain("CommunityTerritoryRoutes");
    expect(activeLazyImports).not.toContain("LaunchPausedPage");
    expect(activeLazyImports).not.toContain("createLaunchPausedRoute");
    expect(appLayoutRoutes).toContain('<Route path="*" element={<P.NotFound />} />');

    // The generic factory may remain for preserved post-MVP/private boundaries;
    // it is not an owner of unavailable URLs in the active shell.
    expect(launchPausedFactory).toContain(
      'import LaunchPausedPage from "@/app/pages/LaunchPausedPage"',
    );
    expect(existsSync("src/app/pages/LaunchPausedPage.tsx")).toBe(true);
  });

  it("keeps inactive and restricted territory states fail-closed in TerritorialLayout", () => {
    expect(territorialLayout).toContain('if (status === "inactive")');
    expect(territorialLayout).toContain('title="Território inativo"');
    expect(territorialLayout).toContain('if (status === "restricted")');
    expect(territorialLayout).toContain('title="Território indisponível"');
    expect(territorialLayout).not.toContain("TerritoryUnavailablePage");
  });
});
