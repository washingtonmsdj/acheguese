import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const rpcMigration = read(
  "supabase/migrations/20260825224500_add_server_authoritative_operational_pin_rpcs.sql",
);
const lockdownMigration = read(
  "supabase/migrations/20260825230000_lock_operational_verifications_behind_rpcs.sql",
);
const service = read(
  "src/core/mobility/services/OperationalVerificationService.ts",
);
const rideReads = read(
  "src/core/mobility/services/mobility.ride-read-queries.ts",
);

describe("Gate 7 operational PIN server authority", () => {
  it("keeps PIN generation and verification in Postgres", () => {
    expect(rpcMigration).toContain("create_operational_pin_verification");
    expect(rpcMigration).toContain("verify_operational_pin");
    expect(rpcMigration).toContain("extensions.gen_random_bytes(4)");
    expect(rpcMigration).toContain("extensions.gen_salt('bf', 10)");
    expect(rpcMigration).toContain("extensions.crypt(p_pin");
    expect(rpcMigration).toContain("v_attempts >= 5");
    expect(rpcMigration).toContain("p_pin !~ '^[0-9]{4}$'");
  });

  it("never exposes verifier material through the status RPC", () => {
    expect(rpcMigration).toContain("get_operational_verification_status");
    expect(rpcMigration).toContain("Deliberately omit pin_hash");
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

  it("derives verified_by from the active session instead of caller input", () => {
    expect(rpcMigration).toContain(
      "v_actor_profile_id uuid := private.current_active_profile_id()",
    );
    expect(rpcMigration).toContain("verified_by = v_actor_profile_id");
    expect(service).not.toContain("p_verified_by");
  });
});
