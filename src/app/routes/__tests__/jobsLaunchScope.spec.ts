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
  it("keeps jobs absent from the active AppLayout graph", () => {
    expect(isLaunchSurfaceEnabled("jobs")).toBe(false);

    const appRoutesSource = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const activeLazySource = readProjectFile(
      "src/app/routes/activeLazyImports.ts",
    );

    for (const forbidden of [
      "JOB_ROUTES",
      'path="/oportunidades"',
      'path="/oportunidades/:id"',
      'path="/vagas',
      '"jobs"',
      "PublicarVagaPage",
      "WorkOpportunitiesPage",
      "VagasPublicPage",
      "TerritorialVagasPage",
    ]) {
      expect(appRoutesSource).not.toContain(forbidden);
      expect(activeLazySource).not.toContain(forbidden);
    }

    expect(appRoutesSource).toContain(
      '<Route path="*" element={<P.NotFound />} />',
    );
  });

  it("preserves the real jobs implementation for post-MVP integration", () => {
    const preservedLazyImports = readProjectFile("src/app/routes/lazyImports.ts");
    const territorialModulesSource = readProjectFile(
      "src/app/routes/territorial/TerritorialModulePages.tsx",
    );

    expect(preservedLazyImports).toContain(
      'import("@/modules/classifieds/jobs/pages/VagasPublicPage")',
    );
    expect(preservedLazyImports).toContain(
      'import("@/modules/work-opportunities/pages/WorkOpportunitiesPage")',
    );
    expect(territorialModulesSource).toContain(
      'import("@/modules/classifieds/jobs/pages/VagasPublicPage")',
    );
  });
});
