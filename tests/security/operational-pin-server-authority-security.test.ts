import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const rpcMigration = read(
  "supabase/migrations/20260825223319_add_server_authoritative_operational_pin_rpcs.sql",
);
const lockdownMigration = read(
  "supabase/migrations/20260825223929_lock_operational_verifications_behind_rpcs.sql",
);
const hardeningMigration = read(
  "supabase/migrations/20260909145145_harden_operational_pin_protocol_g7.sql",
);
const preserveMigration = read(
  "supabase/migrations/20260909145813_preserve_requester_pin_on_driver_requirement_g7.sql",
);
const service = read(
  "src/core/mobility/services/OperationalVerificationService.ts",
);
const requesterPinCard = read(
  "src/modules/mobility/components/passenger/OperationalPinCard.tsx",
);
const rideReads = read(
  "src/core/mobility/services/mobility.ride-read-queries.ts",
);

describe("Gate 7 operational PIN server authority", () => {
  it("keeps PIN generation and verification in Postgres", () => {
    expect(rpcMigration).toContain("create_operational_pin_verification");
    expect(rpcMigration).toContain("verify_operational_pin");
    expect(rpcMigration).toContain("extensions.gen_random_bytes(4)");
    expect(rpcMigration).toContain("extensions.gen_salt('bf',10)");
    expect(rpcMigration).toContain("extensions.crypt(p_pin");
    expect(rpcMigration).toContain("v_attempts>=5");
    expect(rpcMigration).toContain("p_pin !~ '^[0-9]{4}$'");
  });

  it("never exposes verifier material through the status RPC", () => {
    const statusFunctionStart = rpcMigration.indexOf(
      "CREATE OR REPLACE FUNCTION public.get_operational_verification_status",
    );
    const statusFunctionEnd = rpcMigration.indexOf(
      "CREATE OR REPLACE FUNCTION public.verify_operational_pin",
    );
    expect(statusFunctionStart).toBeGreaterThanOrEqual(0);
    expect(statusFunctionEnd).toBeGreaterThan(statusFunctionStart);
    const statusFunction = rpcMigration.slice(statusFunctionStart, statusFunctionEnd);

    expect(statusFunction).not.toContain("v_verification.pin_hash");
    expect(statusFunction).not.toContain("'pin_hash'");
    expect(service).toContain("get_operational_verification_status");
    expect(service).not.toMatch(/\.from\(['\"]operational_verifications['\"]\)/);
    expect(service).not.toContain("bcrypt.compare");
    expect(service).not.toContain("secureRandomDigits");
    expect(rideReads).toContain("get_operational_verification_status");
    expect(rideReads).not.toMatch(/\.from<OperationalVerificationRow>\(['\"]operational_verifications['\"]\)/);
  });

  it("locks the base table away from browser roles", () => {
    expect(lockdownMigration).toMatch(
      /REVOKE ALL PRIVILEGES[\s\S]*ON TABLE public\.operational_verifications[\s\S]*FROM anon, authenticated/i,
    );
    for (const policy of [
      "operational_verifications_insert_by_requester",
      "operational_verifications_select_by_participant",
      "operational_verifications_update_by_participant",
    ]) {
      expect(lockdownMigration).toContain(`DROP POLICY IF EXISTS \"${policy}\"`);
    }
    expect(lockdownMigration).toContain("Gate 7 RPC authority missing");
  });

  it("keeps PIN requirement and issuance server-owned", () => {
    expect(hardeningMigration).toContain("requires_pin_for_rides");
    expect(hardeningMigration).toContain("requires_pin_for_deliveries");
    expect(hardeningMigration).toContain("refresh_operational_pin_for_requester");
    expect(hardeningMigration).toContain("ride_requester_profile_required");
    expect(hardeningMigration).toContain(
      "assigned_driver_required_for_pin_verification",
    );
    expect(hardeningMigration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.create_operational_pin_verification",
    );
    expect(hardeningMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_accept_ride_atomic",
    );

    expect(service).toContain("refresh_operational_pin_for_requester");
    expect(service).not.toContain("create_operational_pin_verification");
    expect(service).not.toContain("resolveRidePINRequirement");
    expect(service).not.toContain("resolveDeliveryPINRequirement");
    expect(service).not.toContain("REQUIRE_PIN_FOR_ALL_RIDES");
    expect(service).not.toContain("REQUIRE_PIN_FOR_ALL_DELIVERIES");
  });

  it("prevents requester self-verification and preserves legitimate pending PINs", () => {
    expect(hardeningMigration).toContain(
      "v_actor_profile_id IS DISTINCT FROM v_ride.driver_profile_id",
    );
    expect(hardeningMigration).toContain(
      "assigned_driver_required_for_pin_verification",
    );
    expect(preserveMigration).toContain(
      "operational_verifications.status = 'pending'",
    );
    expect(preserveMigration).toContain(
      "operational_verifications.required_by IN ('passenger','sender','admin','operation')",
    );
  });

  it("exposes a requester-facing PIN UX without persisting plaintext", () => {
    expect(requesterPinCard).toContain("refreshRequesterPIN");
    expect(requesterPinCard).toContain(
      "Informe o código somente ao motorista ou motoboy",
    );
    expect(requesterPinCard).not.toContain("localStorage");
    expect(requesterPinCard).not.toContain("sessionStorage");
  });

  it("derives verified_by from the active session instead of caller input", () => {
    expect(rpcMigration).toContain(
      "v_actor_profile_id uuid := private.current_active_profile_id()",
    );
    expect(rpcMigration).toContain("verified_by=v_actor_profile_id");
    expect(service).not.toContain("p_verified_by");
  });
});
