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

  it("routes realtime history through the minimal dedicated reader", () => {
    expect(adminService).toContain("AdminMobilityRealtimeRideReadService.listMetricRows()");
    expect(adminService).not.toContain("MobilityAdminQueryService.getAllRides()");
    expect(legacyQueries).not.toContain("static async getAllRides(");
  });

  it("never restores select star for the realtime metric history", () => {
    expect(reader).toContain('.from("ride_requests")');
    expect(reader).not.toContain('select("*")');
  });

  it("keeps only lifecycle, identity-link and value fields needed by realtime metrics", () => {
    const selectStart = reader.indexOf('.select(');
    const selectEnd = reader.indexOf("if (error)", selectStart);
    const projection = reader.slice(selectStart, selectEnd);

    for (const field of [
      "id",
      "status",
      "passenger_profile_id",
      "driver_profile_id",
      "origin",
      "destination",
      "created_at",
      "updated_at",
      "completed_at",
      "cancelled_at",
      "final_price",
      "actual_fare",
      "suggested_price",
      "driver_assigned_at",
      "driver_accepted_at",
    ]) {
      expect(projection).toContain(field);
    }

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
      expect(projection).not.toContain(forbidden);
    }
  });

  it("does not pretend estimated_duration is a ride_requests database column", () => {
    expect(reader).not.toContain('| "estimated_duration"');
    expect(reader).not.toContain(", estimated_duration,");
  });
});
