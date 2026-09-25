import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G107 driver reader consolidation", () => {
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );
  const adminQueries = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );

  it("does not keep duplicate driver-directory readers in static/runtime services", () => {
    expect(existsSync(resolve(process.cwd(), "src/core/mobility/services/MobilityService.impl.ts"))).toBe(false);

    expect(runtime).not.toContain("async getDriverProfiles(");
    expect(runtime).not.toContain("DriverCompleteProfileRecord");
    expect(runtime).not.toContain("driver_complete_profile");
  });

  it("does not restore the retired global admin driver directory", () => {
    expect(adminQueries).not.toContain("static async getAllDriversComplete");
    expect(adminQueries).not.toContain("DriverAnalyticsDirectoryRow");
    expect(adminQueries).not.toContain("AdminDriverAnalyticsRow");
    expect(adminQueries).not.toContain("mapDriverAnalyticsRow");
    expect(adminQueries).not.toContain("normalizeDriverAnalyticsProfile");
  });
});
