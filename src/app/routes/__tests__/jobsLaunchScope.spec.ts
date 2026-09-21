import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("jobs and work opportunities post-MVP boundary", () => {
  it("keeps jobs paused through the single launch gate", () => {
    expect(isLaunchSurfaceEnabled("jobs")).toBe(false);

    const appRoutesSource = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const communityRoutesSource = readProjectFile(
      "src/app/routes/sections/CommunityTerritoryRoutes.tsx",
    );

    expect(appRoutesSource).toMatch(
      /path=\{JOB_ROUTES\.publish\}\s+element=\{launchElement\("jobs", "Vagas"/,
    );
    expect(appRoutesSource).toMatch(
      /path="\/oportunidades"\s+element=\{launchElement\(\s*"jobs",\s*"Oportunidades"/,
    );
    expect(appRoutesSource).toContain(
      'launchTerritorialLayout("jobs", "Vagas")',
    );

    expect(communityRoutesSource).toContain('key: "jobs"');
    expect(communityRoutesSource).toContain('launchSurface: "jobs"');
    expect(communityRoutesSource).toContain('pausedModuleName: "Vagas"');
  });

  it("preserves the real jobs implementation for post-MVP integration", () => {
    const lazyImportsSource = readProjectFile("src/app/routes/lazyImports.ts");
    const territorialModulesSource = readProjectFile(
      "src/app/routes/territorial/TerritorialModulePages.tsx",
    );

    expect(lazyImportsSource).toContain(
      'import("@/modules/classifieds/jobs/pages/VagasPublicPage")',
    );
    expect(lazyImportsSource).toContain(
      'import("@/modules/work-opportunities/pages/WorkOpportunitiesPage")',
    );
    expect(territorialModulesSource).toContain(
      'import("@/modules/classifieds/jobs/pages/VagasPublicPage")',
    );
  });
});
