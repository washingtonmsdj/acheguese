import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G111 admin realtime metric/open ride separation", () => {
  const reader = readProjectFile(
    "src/core/admin/services/AdminMobilityRealtimeRideReadService.ts",
  );
  const adminService = readProjectFile(
    "src/core/admin/services/AdminMobilityService.ts",
  );
  const adminQueries = readProjectFile(
    "src/core/admin/services/admin.queries.ts",
  );
  const adminTypes = readProjectFile("src/core/admin/services/types.ts");
  const dashboard = readProjectFile(
    "src/modules/admin/pages/AdminRealtimeDashboard.tsx",
  );

  it("loads metric history and open ride details through separate read methods", () => {
    expect(reader).toContain("static async listMetricRows()");
    expect(reader).toContain("static async listOpenRideRows()");
    expect(adminService).toContain("getRealtimeMetricRides()");
    expect(adminService).toContain("getRealtimeOpenRides()");
    expect(adminQueries).toContain("adminMobilityService.getRealtimeMetricRides()");
    expect(adminQueries).toContain("adminMobilityService.getRealtimeOpenRides()");
    expect(adminQueries).not.toContain("adminMobilityService.getAllRides()");
  });

  it("keeps identity and route labels out of all-history metric rows", () => {
    const metricStart = reader.indexOf("static async listMetricRows()");
    const openStart = reader.indexOf("static async listOpenRideRows()");
    const metricMethod = reader.slice(metricStart, openStart);

    for (const field of [
      "status",
      "created_at",
      "updated_at",
      "completed_at",
      "cancelled_at",
      "final_price",
      "actual_fare",
      "driver_assigned_at",
      "driver_accepted_at",
    ]) {
      expect(metricMethod).toContain(field);
    }

    for (const forbidden of [
      "passenger_profile_id",
      "driver_profile_id",
      "origin",
      "destination",
      "suggested_price",
    ]) {
      expect(metricMethod).not.toContain(forbidden);
    }
  });

  it("reads identity and route labels only from currently open rides", () => {
    const openStart = reader.indexOf("static async listOpenRideRows()");
    const openMethod = reader.slice(openStart);

    for (const field of [
      "id",
      "status",
      "passenger_profile_id",
      "driver_profile_id",
      "origin",
      "destination",
      "created_at",
      "final_price",
      "suggested_price",
    ]) {
      expect(openMethod).toContain(field);
    }

    expect(openMethod).toContain('.in("status", QUERYABLE_OPEN_RIDE_STATUSES)');
    expect(openMethod).not.toContain("actual_fare");
  });

  it("removes stale ETA and dead row-shape fallbacks from the realtime contract", () => {
    expect(adminTypes).not.toContain("estimated_duration?:");
    expect(dashboard).not.toContain("ride.estimated_duration");
    expect(adminQueries).not.toContain("raw.estimated_duration");
    expect(adminQueries).not.toContain("raw.pickup_location_name");
    expect(adminQueries).not.toContain("raw.pickup_address");
    expect(adminQueries).not.toContain("raw.dropoff_location_name");
    expect(adminQueries).not.toContain("raw.dropoff_address");
    expect(adminQueries).not.toContain("raw.current_price");
  });
});
