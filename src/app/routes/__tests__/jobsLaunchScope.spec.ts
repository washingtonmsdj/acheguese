import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { isLaunchSurfaceEnabled } from "@/config/launchScope";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("jobs and work opportunities launch scope", () => {
  it("keeps jobs surfaces closed by the single launch gate", () => {
    expect(isLaunchSurfaceEnabled("jobs")).toBe(false);

    const appRoutesSource = readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx");
    const communityRoutesSource = readProjectFile(
      "src/app/routes/sections/CommunityTerritoryRoutes.tsx",
    );

    expect(appRoutesSource).toContain(
      'path={JOB_ROUTES.publish} element={launchElement("jobs", "Vagas"',
    );
    expect(appRoutesSource).toContain(
      'path="/oportunidades" element={launchElement("jobs", "Oportunidades"',
    );
    expect(appRoutesSource).toContain(
      'path="/oportunidades/:id" element={launchElement("jobs", "Oportunidades"',
    );
    expect(appRoutesSource).toContain(
      'path={JOB_ROUTES.home} element={launchElement("jobs", "Vagas"',
    );
    expect(appRoutesSource).toContain('launchTerritorialLayout("jobs", "Vagas")');

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

    expect(lazyImportsSource).toContain(
      'export const PublicarVagaPage = lazy(() => import("@/modules/classifieds/jobs/pages/PublicarVagaPage"))',
    );
    expect(lazyImportsSource).toContain(
      'export const VagasPublicPage = lazy(() => import("@/modules/classifieds/jobs/pages/VagasPublicPage"))',
    );
    expect(lazyImportsSource).toContain(
      'export const VagaDetailPublicPage = lazy(() => import("@/modules/classifieds/jobs/pages/VagaDetailPublicPage"))',
    );
    expect(lazyImportsSource).toContain(
      'export const WorkOpportunitiesPage = lazy(() => import("@/modules/work-opportunities/pages/WorkOpportunitiesPage"))',
    );
    expect(lazyImportsSource).toContain(
      'export const WorkOpportunityDetailPage = lazy(() => import("@/modules/work-opportunities/pages/WorkOpportunityDetailPage"))',
    );
    expect(lazyImportsSource).not.toContain('PublicarVagaPage = createLaunchPausedRoute("Vagas")');
    expect(lazyImportsSource).not.toContain('WorkOpportunitiesPage = createLaunchPausedRoute("Oportunidades")');

    expect(territorialModulesSource).toMatch(
      /const\s+VagasPage\s+=\s+lazy\(\(\) => import\('@\/modules\/classifieds\/jobs\/pages\/VagasPublicPage'\)\);/,
    );
    expect(territorialModulesSource).toContain(
      "<VagasPage resolved={resolved} activeMemberIds={activeMemberIds} />",
    );
  });
});
