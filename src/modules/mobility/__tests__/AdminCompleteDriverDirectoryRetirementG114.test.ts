import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G114 retire complete admin driver directory", () => {
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const queryService = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );
  const analyticsReader = readProjectFile(
    "src/core/admin/services/AdminMobilityAnalyticsDriverReadService.ts",
  );

  it("removes the obsolete complete-directory API from admin mobility services", () => {
    expect(adminService).not.toContain("getAllDriversComplete");
    expect(queryService).not.toContain("getAllDriversComplete");
    expect(queryService).not.toContain("AdminDriverAnalyticsRow");
    expect(queryService).not.toContain("DriverAnalyticsDirectoryRow");
  });

  it("keeps analytics on the scoped G113 reader instead", () => {
    expect(analyticsReader).toContain("static async listMetricRows()");
    expect(analyticsReader).toContain("static async listDirectory(");
    expect(analyticsReader).toContain('.select("profile_id, is_verified")');
    expect(analyticsReader).toContain('.in("profile_id", uniqueProfileIds)');
  });
});
