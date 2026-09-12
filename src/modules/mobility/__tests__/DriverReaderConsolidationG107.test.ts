import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G107 driver reader consolidation", () => {
  const staticImpl = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );
  const adminQueries = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );

  it("does not keep duplicate driver-directory readers in static/runtime services", () => {
    expect(staticImpl).not.toContain("static async getDriverProfiles(");
    expect(staticImpl).not.toContain("static async getTopDrivers(");
    expect(staticImpl).not.toContain("static async getDriverCompleteProfile(");
    expect(staticImpl).not.toContain("driver_complete_profile");

    expect(runtime).not.toContain("async getDriverProfiles(");
    expect(runtime).not.toContain("DriverCompleteProfileRecord");
    expect(runtime).not.toContain("driver_complete_profile");
  });

  it("keeps temporary admin analytics driver reads explicit and presence-free", () => {
    const method = adminQueries.slice(
      adminQueries.indexOf("static async getAllDriversComplete"),
      adminQueries.indexOf("static async getRideStats"),
    );

    expect(method).toContain('.from<DriverAnalyticsDirectoryRow>("driver_data")');
    expect(method).toContain("profile_id, rating, total_rides, is_verified");
    expect(method).toContain("vehicle_model, vehicle_plate");
    expect(method).toContain("profiles!inner(name, display_name, avatar_url)");
    expect(method).not.toContain("driver_complete_profile");
    expect(method).not.toContain('select("*")');
    expect(method).not.toContain("is_online");
    expect(method).not.toContain("is_available");
    expect(method).not.toContain("last_location_update");
    expect(method).not.toContain("current_location");
  });

  it("returns a compatibility dto whose ids and names are explicit", () => {
    expect(adminQueries).toContain("export interface AdminDriverAnalyticsRow");
    expect(adminQueries).toContain("id: row.profile_id");
    expect(adminQueries).toContain("profile_id: row.profile_id");
    expect(adminQueries).toContain("display_name: name");
    expect(adminQueries).toContain("avg_rating: rating");
    expect(adminQueries).toContain("profile: {");
  });
});
