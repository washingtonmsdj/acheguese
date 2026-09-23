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

describe("community launch scope routing", () => {
  it("keeps community surfaces paused until formal reactivation", () => {
    expect(isLaunchSurfaceEnabled("community")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityAlerts")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityIssues")).toBe(false);
  });

  it("keeps production feature flags aligned with paused community launch surfaces", () => {
    const productionEnv = readProjectFile(".env.production");

    expect(productionEnv).toMatch(/^VITE_FEATURE_COMMUNITY_ALERTS=false$/m);
    expect(productionEnv).toMatch(/^VITE_FEATURE_COMMUNITY_ISSUES=false$/m);
  });

  it("keeps paused community routes outside the active public tree", () => {
    const routesSource = readProjectFile(
      "src/app/routes/sections/AppLayoutRoutes.tsx",
    );
    const activeLazySource = readProjectFile(
      "src/app/routes/activeLazyImports.ts",
    );

    for (const forbidden of [
      'path="/alertas"',
      'path="/problemas"',
      'path="/recomendacoes',
      'path="/achados-perdidos',
      "CommunityTerritoryRoutes",
      "TerritorialCommunityPage",
      "TerritorialCommunityIssuesPage",
      "CommunityPersistentPortalLayout",
      "CommunityAliasRoute",
      "@/modules/community-",
      "@/core/community-",
    ]) {
      expect(routesSource).not.toContain(forbidden);
      expect(activeLazySource).not.toContain(forbidden);
    }

    expect(routesSource).toContain(
      '<Route path="*" element={<P.NotFound />} />',
    );
  });
});
