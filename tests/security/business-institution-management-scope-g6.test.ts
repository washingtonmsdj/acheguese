import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Business institutional management scope", () => {
  const migrationPath =
    "supabase/migrations/20260907005404_add_business_institution_management_scope_g6.sql";

  it("inherits management through one explicit revocable authority Profile", () => {
    const migration = read(migrationPath);

    expect(migration).toContain(
      "CREATE TABLE private.profile_institution_management_scopes",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.user_can_manage_profile_direct",
    );
    expect(migration).toContain(
      "private.user_can_manage_profile_direct(\n            p_user_id,\n            scope.authority_profile_id",
    );
    expect(migration).toContain("scope.revoked_at IS NULL");
    expect(migration).toContain(
      "authority_profile.profile_type = 'business'",
    );
    expect(migration).toContain(
      "profile_institution_scope_one_active_pair_uidx",
    );

    // The scope is inheritance, not duplicated school memberships.
    expect(migration).not.toContain("INSERT INTO public.profile_members");
    expect(migration).not.toContain("parent_business_id");
    expect(migration).not.toContain("group_members_new");
  });

  it("keeps the institutional grant/revoke surface admin-reviewed and server-only", () => {
    const migration = read(migrationPath);

    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.admin_grant_business_institution_scope",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.admin_revoke_business_institution_scope",
    );
    expect(migration).toContain(
      "NOT COALESCE(private.is_admin(p_actor_user_id), false)",
    );
    expect(migration).toContain(
      "institution_scope_official_evidence_required",
    );
    expect(migration).toContain("institution_scope_public_school_required");
    expect(migration).toContain("institution_scope_network_mismatch");
    expect(migration).toContain(
      "FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.admin_grant_business_institution_scope",
    );
    expect(migration).toContain(
      "FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.admin_revoke_business_institution_scope",
    );
    expect(migration).toContain("TO service_role;");
  });

  it("does not weaken structural ownership or people/access mutations", () => {
    const transfer = read(
      "supabase/migrations/20260906124554_fix_business_claim_canonical_transfer_g6.sql",
    );
    const people = read(
      "supabase/migrations/20260906085824_harden_profile_delegated_management_g6.sql",
    );

    expect(transfer).toContain("AND p.user_id = p_actor_user_id");
    expect(transfer).not.toContain(
      "private.user_can_manage_profile(p_actor_user_id, p_profile_id)",
    );

    expect(people).toContain(
      "Only the profile owner can manage people and access",
    );
  });
});
