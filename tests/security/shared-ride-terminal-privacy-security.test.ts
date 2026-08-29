import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260825222132_harden_shared_ride_terminal_privacy.sql",
);
const rideShareService = readProjectFile(
  "src/core/safety/services/SafetyRideShareService.ts",
);

const TERMINAL_STATUSES = [
  "delivered",
  "failed_delivery",
  "completed",
  "cancelled_by_passenger",
  "cancelled_by_driver",
  "expired",
  "failed",
  "cancelled",
] as const;

const ACTIVE_SHARE_STATUSES = [
  "pending",
  "requested",
  "searching_driver",
  "driver_assigned",
  "driver_accepted",
  "driver_arriving",
  "passenger_boarded",
  "in_progress",
  "pickup_confirmed",
  "in_delivery",
  "accepted",
] as const;

describe("shared ride terminal privacy", () => {
  it("keeps public bearer-token reads bounded to non-terminal rides", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.get_shared_ride_safety_data",
    );
    expect(migration).toContain("p_share_token ~ '^[A-Za-z0-9]{32}$'");
    expect(migration).toContain("share.status = 'active'");
    expect(migration).toContain("share.expires_at > now()");
    expect(migration).toContain("ride.status = ANY");

    for (const status of ACTIVE_SHARE_STATUSES) {
      expect(migration).toContain(`'${status}'`);
    }

    expect(rideShareService).toContain("get_shared_ride_safety_data");
  });

  it("automatically revokes active shares when rides become terminal", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.revoke_terminal_ride_shares",
    );
    expect(migration).toContain("trg_revoke_terminal_ride_shares");
    expect(migration).toMatch(/AFTER UPDATE OF status ON public\.ride_requests/i);
    expect(migration).toContain("SET status = 'revoked'");
    expect(migration).toContain("revoked_at = COALESCE(revoked_at, now())");

    for (const status of TERMINAL_STATUSES) {
      expect(migration).toContain(`'${status}'`);
    }
  });

  it("does not expose the private trigger function to browser roles", () => {
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION private\.revoke_terminal_ride_shares\(\) FROM PUBLIC, anon, authenticated/i,
    );
  });

  it("backfills terminal active shares without deleting audit history", () => {
    expect(migration).toContain("UPDATE public.ride_shares share");
    expect(migration).toContain("share.status = 'active'");
    expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.ride_shares/i);
  });
});
