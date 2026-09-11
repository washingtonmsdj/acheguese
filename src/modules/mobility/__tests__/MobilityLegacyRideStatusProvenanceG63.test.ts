import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LEGACY_CLOSED_RIDE_STATUSES,
  LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES,
} from "@/core/mobility/core/RideLifecycleStatus";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const g63 = readProjectFile(
  "supabase/migrations/20260911040500_reconcile_ambiguous_legacy_ride_statuses_g63.sql",
);

describe("G63 legacy ride status provenance", () => {
  it("keeps ambiguous aliases explicitly unresolved at the runtime boundary", () => {
    expect(LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES).toEqual(["driver_arrived"]);
    expect(LEGACY_CLOSED_RIDE_STATUSES).toEqual(["cancelled"]);
  });

  it("advances driver_arrived only when canonical timestamps prove a later state", () => {
    expect(g63).toContain("ride.completed_at IS NOT NULL");
    expect(g63).toContain("SET status = 'completed'");

    expect(g63).toContain("ride.started_at IS NOT NULL");
    expect(g63).toContain("SET status = 'in_progress'");

    expect(g63).toContain("ride.passenger_boarded_at IS NOT NULL");
    expect(g63).toContain("SET status = 'passenger_boarded'");

    expect(g63).toContain("ride.ride_mode = 'ride'");
  });

  it("does not guess driver_arrived as driver_arriving", () => {
    expect(g63).not.toContain("SET status = 'driver_arriving'");
  });

  it("reconciles cancelled only from participant audit authority", () => {
    expect(g63).toContain("proof.changed_by = ride.passenger_profile_id::text");
    expect(g63).toContain("SET status = 'cancelled_by_passenger'");
    expect(g63).toContain("proof.changed_by = ride.driver_profile_id::text");
    expect(g63).toContain("SET status = 'cancelled_by_driver'");
    expect(g63).toContain("audit.to_state::text IN");
  });

  it("leaves admin/system or otherwise unprovable cancellations untouched", () => {
    expect(g63).not.toContain("changed_by = 'system'");
    expect(g63).not.toContain("changed_by LIKE 'admin:%'");
    expect(g63).toContain("No UPDATE is intentionally issued for remaining");
  });

  it("records every deterministic rewrite in ride_state_audit", () => {
    expect(g63.match(/INSERT INTO public\.ride_state_audit/g)?.length).toBe(5);
    expect(g63).toContain("'migration:g63'");
    expect(g63).toContain("'proof', 'completed_at'");
    expect(g63).toContain("'proof', 'started_at'");
    expect(g63).toContain("'proof', 'passenger_boarded_at'");
    expect(g63).toContain("ride_state_audit.changed_by=passenger_profile_id");
    expect(g63).toContain("ride_state_audit.changed_by=driver_profile_id");
  });
});
