import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G116 suspended driver metrics", () => {
  const reader = readProjectFile(
    "src/core/admin/services/AdminSuspendedDriverMetricsService.ts",
  );
  const component = readProjectFile(
    "src/core/admin/components/ReputationBanishments.tsx",
  );
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const queryService = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );

  it("intersects suspended profiles with the driver domain before lifecycle metrics", () => {
    expect(reader).toContain('.from<DriverProfileIdRow>("driver_data")');
    expect(reader).toContain('.select("profile_id")');
    expect(reader).toContain('.in("profile_id", uniqueProfileIds)');
    expect(reader).toContain(
      "AdminDriverLifecycleMetricsService.load(driverProfileIds)",
    );
  });

  it("loads suspended-driver metrics in batch without casting ride arrays", () => {
    expect(component).toContain("AdminSuspendedDriverMetricsService.load(");
    expect(component).toContain("lifecycle.driverCancellationRate");
    expect(component).not.toContain("adminMobilityService.getUserRides");
    expect(component).not.toContain("getCancellationRate(");
    expect(component).not.toContain("suspended.map(async");
  });

  it("retires orphan generic admin ride readers", () => {
    expect(adminService).not.toContain("getRecentRides(");
    expect(adminService).not.toContain("getUserRides(");
    expect(queryService).not.toContain("static async getRecentRides(");
    expect(queryService).not.toContain("static async getUserRides(");
    expect(queryService).not.toContain('select("*")');
  });
});
