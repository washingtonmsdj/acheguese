import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LEGACY_CLOSED_RIDE_STATUSES,
  LEGACY_RIDE_STATUS_ALIASES,
  LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES,
  toCanonicalRideState,
} from "@/core/mobility/core/RideLifecycleStatus";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911032000_enforce_canonical_ride_status_writes_g62.sql",
);
const adapter = readProjectFile(
  "src/core/mobility/services/RideCanonicalAdapter.ts",
);

describe("G62 canonical ride status write ratchet", () => {
  it("owns deterministic legacy aliases in one lifecycle SSOT", () => {
    expect(LEGACY_RIDE_STATUS_ALIASES).toEqual({
      pending: "requested",
      accepted: "driver_accepted",
      driver_on_the_way: "driver_arriving",
      passenger_on_board: "passenger_boarded",
    });

    expect(toCanonicalRideState("pending")).toBe("requested");
    expect(toCanonicalRideState("accepted")).toBe("driver_accepted");
    expect(toCanonicalRideState("driver_on_the_way")).toBe("driver_arriving");
    expect(toCanonicalRideState("passenger_on_board")).toBe("passenger_boarded");
  });

  it("does not guess ambiguous historical lifecycle meaning", () => {
    expect(LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES).toEqual(["driver_arrived"]);
    expect(LEGACY_CLOSED_RIDE_STATUSES).toEqual(["cancelled"]);
    expect(toCanonicalRideState("driver_arrived")).toBeNull();
    expect(toCanonicalRideState("cancelled")).toBeNull();
  });

  it("normalizes only deterministic aliases before enabling the write gate", () => {
    for (const [legacy, canonical] of Object.entries(LEGACY_RIDE_STATUS_ALIASES)) {
      expect(migration).toContain(`SET status = '${canonical}'`);
      expect(migration).toContain(`WHERE status::text = '${legacy}'`);
    }

    expect(migration).not.toContain("SET status = 'driver_arrived'");
    expect(migration).not.toContain("SET status = 'cancelled'");

    const triggerIndex = migration.indexOf(
      "CREATE TRIGGER ride_requests_enforce_canonical_status_write",
    );
    expect(triggerIndex).toBeGreaterThan(0);
    expect(migration.indexOf("WHERE status::text = 'passenger_on_board'")).toBeLessThan(
      triggerIndex,
    );
  });

  it("makes requested the database default and rejects future legacy writes", () => {
    expect(migration).toContain("ALTER COLUMN status SET DEFAULT 'requested'");
    expect(migration).toContain("BEFORE INSERT OR UPDATE OF status");
    expect(migration).toContain("ERRCODE = '23514'");

    const guard = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION private.enforce_canonical_ride_status_write"),
      migration.indexOf("REVOKE ALL ON FUNCTION private.enforce_canonical_ride_status_write"),
    );

    for (const canonical of [
      "requested",
      "searching_driver",
      "driver_assigned",
      "driver_accepted",
      "driver_arriving",
      "passenger_boarded",
      "in_progress",
      "pickup_confirmed",
      "in_delivery",
      "delivered",
      "failed_delivery",
      "completed",
      "cancelled_by_passenger",
      "cancelled_by_driver",
      "expired",
      "failed",
    ]) {
      expect(guard).toContain(`'${canonical}'`);
    }

    for (const legacy of [
      "pending",
      "accepted",
      "driver_on_the_way",
      "driver_arrived",
      "passenger_on_board",
      "cancelled",
    ]) {
      expect(guard).not.toContain(`'${legacy}'`);
    }
  });

  it("routes compatibility reads through the lifecycle SSOT instead of a second alias map", () => {
    expect(adapter).toContain("toCanonicalRideState");
    expect(adapter).toContain("LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES");
    expect(adapter).toContain("LEGACY_CLOSED_RIDE_STATUSES");
    expect(adapter).not.toContain("const LEGACY_STATUS_ALIASES");
    expect(adapter).not.toContain('if (!status) return "pending"');
  });
});
