import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Safety ride-share authority", () => {
  it("keeps bearer tokens server-owned and creation participant-bound", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909190000_server_owned_ride_share_tokens_g12.sql",
    );
    const authorityFollowUp = readProjectFile(
      "supabase/migrations/20260909191000_dedupe_ride_share_token_authority_g12.sql",
    );
    const existingTokenAuthority = readProjectFile(
      "supabase/migrations/20260819085526_server_generate_ride_share_tokens.sql",
    );
    const service = readProjectFile(
      "src/core/safety/services/SafetyRideShareService.ts",
    );

    expect(migration).toContain("public.create_safety_ride_share");
    expect(existingTokenAuthority).toContain(
      "private.assign_ride_share_token",
    );
    expect(existingTokenAuthority).toContain(
      "extensions.gen_random_bytes(16)",
    );
    expect(existingTokenAuthority).toContain(
      "trg_assign_ride_share_token",
    );
    expect(authorityFollowUp).toContain(
      "canonical ride-share token trigger missing",
    );
    expect(authorityFollowUp).toContain(
      "INSERT INTO public.ride_shares",
    );
    expect(authorityFollowUp).not.toContain(
      "extensions.gen_random_bytes(16)",
    );
    expect(migration).toContain(
      "profile.user_id = v_actor_user_id",
    );
    expect(migration).toContain("ride_participant_required");
    expect(migration).toContain("active_ride_required");
    expect(migration).toContain(
      "REVOKE INSERT ON TABLE public.ride_shares FROM authenticated",
    );
    expect(migration).toContain(
      "DROP POLICY IF EXISTS ride_shares_insert_own",
    );
    expect(migration).toContain(
      "p_share_token ~ '^[0-9a-f]{32}$'",
    );
    expect(migration).toContain("SET search_path TO ''");
    expect(migration).toContain("TO anon, authenticated, service_role");

    expect(service).toContain('"create_safety_ride_share"');
    expect(service).toContain("p_expires_in_hours: expirationHours");
    expect(service).not.toContain("secureRandomString");
    expect(service).not.toContain('.from<RideShareRow>("ride_shares")');
    expect(service).not.toContain(".insert(");
  });
});
