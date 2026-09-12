import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G98 admin ride stats lifecycle", () => {
  const service = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );

  it("derives open and cancelled states from lifecycle authorities", () => {
    expect(service).toContain("QUERYABLE_OPEN_RIDE_STATUSES");
    expect(service).toContain("LEGACY_CLOSED_RIDE_STATUSES");
    expect(service).toContain("RIDE_STATE.CANCELLED_BY_DRIVER");
    expect(service).toContain("RIDE_STATE.CANCELLED_BY_PASSENGER");
    expect(service).toContain("RIDE_STATE.COMPLETED");
    expect(service).toContain("RIDE_STATE.FAILED");
    expect(service).toContain("RIDE_STATE.EXPIRED");
  });

  it("does not expose legacy pending or revenue labels", () => {
    expect(service).toContain("open_rides: number");
    expect(service).toContain("completed_value: number");
    expect(service).not.toContain("pending_rides: number");
    expect(service).not.toContain("total_revenue: number");
    expect(service).not.toContain('ride.status === "cancelled"');
    expect(service).not.toContain('ride.status === "pending"');
  });
});
