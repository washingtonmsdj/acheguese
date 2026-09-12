import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G102 shared ride lifecycle classifications", () => {
  const lifecycle = readProjectFile(
    "src/core/mobility/core/RideLifecycleStatus.ts",
  );
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );

  it("owns open, pre-accept, driver-owned and cancelled read classifications", () => {
    expect(lifecycle).toContain("QUERYABLE_OPEN_RIDE_STATUSES");
    expect(lifecycle).toContain("QUERYABLE_CLOSED_RIDE_STATUSES");
    expect(lifecycle).toContain("QUERYABLE_PRE_ACCEPT_RIDE_STATUSES");
    expect(lifecycle).toContain("DRIVER_OWNED_OPEN_RIDE_STATUSES");
    expect(lifecycle).toContain("QUERYABLE_CANCELLED_RIDE_STATUSES");
    expect(lifecycle).toContain("isOpenRideStatus");
    expect(lifecycle).toContain("isPreAcceptRideStatus");
    expect(lifecycle).toContain("isDriverOwnedOpenRideStatus");
    expect(lifecycle).toContain("isCancelledRideStatus");
  });

  it("keeps driver_assigned in pre-accept instead of driver-owned tracking states", () => {
    expect(lifecycle).toContain("RIDE_STATE.DRIVER_ASSIGNED");
    expect(lifecycle).toContain("...QUERYABLE_PRE_ACCEPT_RIDE_STATUSES");
    expect(lifecycle).toContain("NON_OPERATIONAL_DRIVER_OPEN_STATUSES");
  });

  it("makes admin ride stats consume shared classifiers", () => {
    expect(adminService).toContain("isOpenRideStatus(ride.status)");
    expect(adminService).toContain("isCancelledRideStatus(ride.status)");
    expect(adminService).not.toContain("ADMIN_OPEN_RIDE_STATUSES");
    expect(adminService).not.toContain("ADMIN_CANCELLED_RIDE_STATUSES");
  });
});
