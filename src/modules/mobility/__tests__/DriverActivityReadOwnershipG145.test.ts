import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G145 driver activity read ownership", () => {
  const activity = readProjectFile(
    "src/core/mobility/services/DriverActivityStatsService.ts",
  );
  const staticService = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );

  it("owns the bounded ride-session read in DriverActivityStatsService", () => {
    expect(activity).toContain('from("ride_requests")');
    expect(activity).toContain('.select("started_at, completed_at")');
    expect(activity).toContain("DRIVER_ACTIVITY_SESSION_LIMIT = 300");
    expect(activity).not.toContain('select("*")');
  });

  it("keeps presence owned by driver availability", () => {
    expect(activity).toContain("DriverAvailabilityService.getStatus(driverProfileId)");
    expect(activity).not.toContain('from("driver_data")');
  });

  it("retires the static compatibility session reader", () => {
    expect(staticService).not.toContain("getDriverRideSessions(");
    expect(activity).not.toContain("MobilityService.getDriverRideSessions");
  });
});
