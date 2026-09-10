import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

describe("profile public RPC contract", () => {
  it("retires generic public mutation RPCs after domain broker cutover", () => {
    const contract = read(
      "supabase/migrations/20260910005500_retire_legacy_profile_public_rpcs_g36.sql",
    );
    const validator = read("tools/supabase/validate-implementation.ts");
    const profileEdge = read("supabase/functions/profile-rpc/index.ts");
    const mobilityEdge = read("supabase/functions/mobility-rpc/index.ts");

    for (const signature of [
      "public.create_profile_with_extension",
      "public.update_profile_handle(uuid, text)",
      "public.delete_profile(uuid)",
      "public.transfer_profile_ownership(uuid, uuid)",
      "public.invite_profile_member_by_email(uuid, text, text)",
    ]) {
      expect(contract).toContain(`DROP FUNCTION IF EXISTS ${signature}`);
    }
    expect(contract).not.toContain("CASCADE");

    expect(validator).not.toContain("supabase.rpc('create_profile_with_extension'");
    expect(validator).toContain("profile_rpc_create_personal");
    expect(validator).toContain("mobility_rpc_create_driver_profile");

    expect(profileEdge).toContain('createPersonal: true');
    expect(profileEdge).not.toContain('createProfile: true');
    expect(mobilityEdge).toContain('createDriverProfile: true');
    expect(mobilityEdge).toContain('ensureAdminDriverProfile: true');
  });
});
