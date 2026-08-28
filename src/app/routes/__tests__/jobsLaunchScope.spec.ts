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

describe("jobs and work opportunities launch scope", () => {
  it("keeps jobs surfaces enabled through the single launch gate", () => {
    expect(isLaunchSurfaceEnabled("jobs")).toBe(true);

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
    expect(appRoutesSource).toMatch(
      /path="\/oportunidades\/:id"\s+element=\{launchElement\(\s*"jobs",\s*"Oportunidades"/,
    );
    expect(appRoutesSource).toMatch(
      /path=\{JOB_ROUTES\.home\}\s+element=\{launchElement\("jobs", "Vagas"/,
    );
    expect(appRoutesSource).toContain(
      'launchTerritorialLayout("jobs", "Vagas")',
    );

    expect(communityRoutesSource).toContain('key: "jobs"');
    expect(communityRoutesSource).toContain('key: "jobs-publish"');
    expect(communityRoutesSource).toContain('launchSurface: "jobs"');
    expect(communityRoutesSource).toContain('pausedModuleName: "Vagas"');
  });

  it("loads real jobs and work-opportunities pages behind the gate", () => {
    const lazyImportsSource = readProjectFile("src/app/routes/lazyImports.ts");
    const territorialModulesSource = readProjectFile(
      "src/app/routes/territorial/TerritorialModulePages.tsx",
    );

    expect(lazyImportsSource).toMatch(
      /export const PublicarVagaPage = lazy\(\s*\(\) => import\("@\/modules\/classifieds\/jobs\/pages\/PublicarVagaPage"\),/,
    );
    expect(lazyImportsSource).toMatch(
      /export const VagasPublicPage = lazy\(\s*\(\) => import\("@\/modules\/classifieds\/jobs\/pages\/VagasPublicPage"\),/,
    );
    expect(lazyImportsSource).toMatch(
      /export const VagaDetailPublicPage = lazy\(\s*\(\) => import\("@\/modules\/classifieds\/jobs\/pages\/VagaDetailPublicPage"\),/,
    );
    expect(lazyImportsSource).toMatch(
      /export const WorkOpportunitiesPage = lazy\(\s*\(\) => import\("@\/modules\/work-opportunities\/pages\/WorkOpportunitiesPage"\),/,
    );
    expect(lazyImportsSource).toMatch(
      /export const WorkOpportunityDetailPage = lazy\(\s*\(\) => import\("@\/modules\/work-opportunities\/pages\/WorkOpportunityDetailPage"\),/,
    );
    expect(lazyImportsSource).not.toContain(
      'PublicarVagaPage = createLaunchPausedRoute("Vagas")',
    );
    expect(lazyImportsSource).not.toContain(
      'WorkOpportunitiesPage = createLaunchPausedRoute("Oportunidades")',
    );

    expect(territorialModulesSource).toMatch(
      /const\s+VagasPage\s+=\s+lazy\(\s*\(\) => import\("@\/modules\/classifieds\/jobs\/pages\/VagasPublicPage"\),?\s*\);/,
    );
    expect(territorialModulesSource).toContain(
      "<VagasPage resolved={resolved} activeMemberIds={activeMemberIds} />",
    );
  });
});
