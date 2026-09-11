import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("G68 ride-scoped precise tracking privacy", () => {
  it("does not expose passenger live GPS before explicit driver acceptance", () => {
    const policyMigration = readProjectFile(
      "supabase/migrations/20260911100000_tighten_driver_location_read_window_g68.sql",
    );
    const viewPolicy = readProjectFile(
      "src/core/mobility/core/PassengerRideViewPolicy.ts",
    );

    expect(policyMigration).toContain('"driver_locations_authorized_read"');
    expect(policyMigration).toContain("'driver_accepted'");
    expect(policyMigration).toContain("'driver_arriving'");
    expect(policyMigration).not.toContain("'accepted'");

    const liveStates = viewPolicy.slice(
      viewPolicy.indexOf("PASSENGER_LIVE_TRACKING_STATES"),
      viewPolicy.indexOf("const LIVE_TRACKING_STATE_SET"),
    );
    expect(liveStates).not.toContain("RIDE_STATE.DRIVER_ASSIGNED");
    expect(liveStates).toContain("RIDE_STATE.DRIVER_ACCEPTED");
  });

  it("authorizes precise location through a ride-scoped SECURITY DEFINER read", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260911101000_add_ride_scoped_driver_location_read_g68.sql",
    );

    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_get_driver_location_for_ride",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain(
      "SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'",
    );
    expect(migration).toContain("private.current_active_profile_id()");
    expect(migration).toContain("ride_participant_required");
    expect(migration).toContain("v_ride.passenger_profile_id");
    expect(migration).toContain("v_ride.driver_profile_id");
    expect(migration).toContain("REVOKE ALL ON FUNCTION");
    expect(migration).toContain("FROM PUBLIC, anon");
  });

  it("binds passenger initial/refetch reads to ride id and fails closed", () => {
    const accessService = readProjectFile(
      "src/core/mobility/services/RideTrackingAccessService.ts",
    );
    const hook = readProjectFile(
      "src/core/mobility/hooks/useDriverLocation.ts",
    );

    expect(accessService).toContain(
      '"mobility_get_driver_location_for_ride"',
    );
    expect(accessService).toContain("{ p_ride_id: rideId }");
    expect(accessService).not.toContain("driver_locations");

    expect(hook).toContain("RideTrackingAccessService.getDriverPositionForRide(rideId)");
    expect(hook).toContain(
      "access.data.driverProfileId !== driverProfileId",
    );
    expect(hook).toContain("!access.data.trackingAllowed");
    expect(hook).toContain("setLocation(null)");

    const genericReadIndex = hook.indexOf(
      "trackingService.getCurrentPosition(\n          driverProfileId",
    );
    const rideBranchIndex = hook.indexOf("if (rideId)");
    expect(rideBranchIndex).toBeGreaterThan(-1);
    expect(genericReadIndex).toBeGreaterThan(rideBranchIndex);
  });
});
