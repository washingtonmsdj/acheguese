import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G113 admin analytics driver separation", () => {
  const reader = readProjectFile(
    "src/core/admin/services/AdminMobilityAnalyticsDriverReadService.ts",
  );
  const hook = readProjectFile(
    "src/modules/admin/pages/mobility-analytics/useAdminMobilityAnalytics.ts",
  );

  it("keeps global analytics driver rows identity-free", () => {
    const metricStart = reader.indexOf("static async listMetricRows()");
    const directoryStart = reader.indexOf("static async listDirectory(");
    const metricMethod = reader.slice(metricStart, directoryStart);

    expect(metricMethod).toContain('.select("profile_id, is_verified")');
    for (const forbidden of ["profiles!inner", "name", "display_name", "avatar_url"]) {
      expect(metricMethod).not.toContain(forbidden);
    }
  });

  it("scopes identity reads to selected-window ranking driver ids", () => {
    const directoryStart = reader.indexOf("static async listDirectory(");
    const directoryMethod = reader.slice(directoryStart);

    expect(directoryMethod).toContain('.in("profile_id", uniqueProfileIds)');
    expect(directoryMethod).toContain(
      "profiles!inner(name, display_name, avatar_url)",
    );
    expect(hook).toContain("completedRides");
    expect(hook).toContain("rankingDriverIds");
    expect(hook).toContain(
      "AdminMobilityAnalyticsDriverReadService.listDirectory(\n          rankingDriverIds",
    );
  });

  it("does not restore the former global identity directory call", () => {
    expect(hook).toContain("AdminMobilityAnalyticsDriverReadService.listMetricRows()");
    expect(hook).not.toContain("AdminMobilityAnalyticsDriverReadService.list()");
    expect(reader).not.toContain("static async list():");
  });
});
