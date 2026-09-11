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
  "supabase/migrations/20260825132718_harden_driver_locations_read_rls.sql",
);
const canonicalStatusGate = readProjectFile(
  "supabase/migrations/20260911032000_enforce_canonical_ride_status_writes_g62.sql",
);
const activeCard = readProjectFile(
  "src/modules/mobility/components/passenger/ActiveRideCard.tsx",
);

describe("G65 passenger ride view policy", () => {
  it("matches live-map visibility to the canonical precise-location window", () => {
    expect(PASSENGER_LIVE_TRACKING_STATES).toEqual([
      "driver_assigned",
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

  it("keeps the historical accepted RLS alias non-authoritative after G62", () => {
    expect(locationRls).toContain("'accepted'");
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
