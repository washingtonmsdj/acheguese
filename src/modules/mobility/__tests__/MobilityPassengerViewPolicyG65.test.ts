import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getPassengerRideViewAvailability,
  PASSENGER_LIVE_TRACKING_STATES,
} from "@/core/mobility/core/PassengerRideViewPolicy";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const locationRls = readProjectFile(
  "supabase/migrations/20260911100000_tighten_driver_location_read_window_g68.sql",
);
const canonicalStatusGate = readProjectFile(
  "supabase/migrations/20260911032000_enforce_canonical_ride_status_writes_g62.sql",
);
const activeCard = readProjectFile(
  "src/modules/mobility/components/passenger/ActiveRideCard.tsx",
);

describe("G65/G68 passenger ride view policy", () => {
  it("matches live-map visibility to the post-accept precise-location RLS allowlist", () => {
    expect(PASSENGER_LIVE_TRACKING_STATES).toEqual([
      "driver_accepted",
      "driver_arriving",
      "passenger_boarded",
      "in_progress",
      "pickup_confirmed",
      "in_delivery",
    ]);

    for (const status of PASSENGER_LIVE_TRACKING_STATES) {
      expect(locationRls).toContain(`'${status}'`);
      expect(getPassengerRideViewAvailability(status).showLiveMap).toBe(true);
    }

    expect(getPassengerRideViewAvailability("driver_assigned").showLiveMap).toBe(false);

    for (const status of [
      "requested",
      "searching_driver",
      "delivered",
      "failed_delivery",
      "completed",
      "cancelled_by_passenger",
      "cancelled_by_driver",
      "expired",
      "failed",
    ]) {
      expect(getPassengerRideViewAvailability(status).showLiveMap).toBe(false);
    }
  });

  it("removes historical accepted from current tracking authority while preserving G62 cleanup", () => {
    expect(locationRls).not.toContain("'accepted'");
    expect(locationRls).not.toContain("'driver_assigned'");
    expect(canonicalStatusGate).toContain("WHERE status::text = 'accepted'");
    expect(canonicalStatusGate).toContain("SET status = 'driver_accepted'");
    const guard = canonicalStatusGate.slice(
      canonicalStatusGate.indexOf(
        "CREATE OR REPLACE FUNCTION private.enforce_canonical_ride_status_write",
      ),
      canonicalStatusGate.indexOf(
        "REVOKE ALL ON FUNCTION private.enforce_canonical_ride_status_write",
      ),
    );
    expect(guard).not.toContain("'accepted'");
  });

  it("derives passenger cancellation from RideStateMachine semantics", () => {
    expect(getPassengerRideViewAvailability("requested").canCancel).toBe(true);
    expect(getPassengerRideViewAvailability("searching_driver").canCancel).toBe(true);
    expect(getPassengerRideViewAvailability("driver_assigned").canCancel).toBe(true);
    expect(getPassengerRideViewAvailability("driver_accepted").canCancel).toBe(true);
    expect(getPassengerRideViewAvailability("driver_arriving").canCancel).toBe(true);
    expect(getPassengerRideViewAvailability("passenger_boarded").canCancel).toBe(false);
    expect(getPassengerRideViewAvailability("in_progress").canCancel).toBe(false);
  });

  it("canonicalizes deterministic aliases and fails closed for ambiguous location", () => {
    expect(getPassengerRideViewAvailability("driver_on_the_way")).toEqual(
      getPassengerRideViewAvailability("driver_arriving"),
    );
    expect(getPassengerRideViewAvailability("passenger_on_board")).toEqual(
      getPassengerRideViewAvailability("passenger_boarded"),
    );
    expect(getPassengerRideViewAvailability("driver_arrived")).toEqual({
      showLiveMap: false,
      showDriverInfo: true,
      canCancel: false,
    });
    expect(getPassengerRideViewAvailability("cancelled")).toEqual({
      showLiveMap: false,
      showDriverInfo: false,
      canCancel: false,
    });
  });

  it("removes local status allowlists from the active passenger card", () => {
    expect(activeCard).toContain("getPassengerRideViewAvailability(ride.status)");
    expect(activeCard).not.toContain("MAP_VISIBLE_STATUSES");
    expect(activeCard).not.toContain("DRIVER_INFO_STATUSES");
    expect(activeCard).not.toContain("CANCELLABLE_STATUSES");
  });
});
