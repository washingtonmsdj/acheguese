import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G110 admin realtime ride projection", () => {
  const reader = readProjectFile(
    "src/core/admin/services/AdminMobilityRealtimeRideReadService.ts",
  );
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const legacyQueries = readProjectFile(
    "src/core/admin/services/MobilityAdminQueryService.ts",
  );

  it("keeps realtime history on the dedicated reader instead of the legacy query service", () => {
    expect(adminService).toContain("AdminMobilityRealtimeRideReadService.listMetricRows()");
    expect(adminService).not.toContain("MobilityAdminQueryService.getAllRides()");
    expect(legacyQueries).not.toContain("static async getAllRides(");
  });

  it("never restores select star in the realtime ride boundary", () => {
    expect(reader).toContain('"ride_requests"');
    expect(reader).not.toContain('select("*")');
  });

  it("keeps sensitive delivery and custody fields outside realtime reads", () => {
    for (const forbidden of [
      "recipient_phone",
      "recipient_name",
      "delivery_notes",
      "proof_of_delivery",
      "failed_delivery_metadata",
      "failed_delivery_reason",
      "origin_lat",
      "origin_lng",
      "destination_lat",
      "destination_lng",
      "observation",
      "package_description",
    ]) {
      expect(reader).not.toContain(forbidden);
    }
  });

  it("does not pretend estimated_duration is a ride_requests database column", () => {
    expect(reader).not.toContain('| "estimated_duration"');
    expect(reader).not.toContain(", estimated_duration,");
  });
});
