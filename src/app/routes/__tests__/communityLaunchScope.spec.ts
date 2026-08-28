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
  it("keeps alerts and issues paused until E2E and RLS validation are complete", () => {
    expect(isLaunchSurfaceEnabled("communityAlerts")).toBe(false);
    expect(isLaunchSurfaceEnabled("communityIssues")).toBe(false);
  });

  it("keeps global alert and issue routes behind launchElement", () => {
    const routesSource = readProjectFile("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(routesSource).toMatch(
      /<Route\s+path="\/alertas"\s+element=\{launchElement\(\s*"communityAlerts"/,
    );
    expect(routesSource).toMatch(
      /<Route\s+path="\/problemas"\s+element=\{launchElement\(\s*"communityIssues"/,
    );
  });

  it("keeps territorial community issue routes behind launchSurface metadata", () => {
    const routesSource = readProjectFile(
      "src/app/routes/sections/CommunityTerritoryRoutes.tsx",
    );

    expect(routesSource).toContain('key: "issues"');
    expect(routesSource).toContain('launchSurface: "communityIssues"');
    expect(routesSource).toContain('pausedModuleName: "Problemas"');
  });
});
