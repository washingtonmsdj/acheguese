import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Profile verification SSOT", () => {
  const migration = read(
    "supabase/migrations/20260718150000_consolidate_profile_verification_core.sql",
  );
  const transitionMigration = read(
    "supabase/migrations/20260718163000_harden_profile_verification_transitions.sql",
  );

  it("keeps request lifecycle and private audit in the verification aggregate", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.verification",
    );
    expect(migration).toContain(
      "status IN ('pending', 'approved', 'rejected', 'revoked')",
    );
    expect(migration).toContain("private.profile_verification_audit_log");
    expect(migration).toContain(
      "ALTER TABLE public.verification FORCE ROW LEVEL SECURITY",
    );
    expect(migration).toContain("profile_verification_direct_write_forbidden");
    expect(migration).toContain("request_profile_verification");
    expect(migration).toContain("review_profile_verification");
  });

  it("binds self-service verification requests to the authenticated profile owner", () => {
    expect(migration).toContain("v_actor_user_id UUID := auth.uid()");
    expect(migration).toContain(
      "NOT private.auth_owns_active_profile(p_profile_id)",
    );
    expect(migration).toContain("profile_verification_profile_not_owned");
    expect(migration).toContain(
      "'storage://verification-documents/' || p_profile_id::TEXT || '/%'",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.request_profile_verification(\n  UUID, TEXT, TEXT, TEXT, TEXT\n) FROM PUBLIC, anon",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.request_profile_verification(\n  UUID, TEXT, TEXT, TEXT, TEXT\n) TO authenticated",
    );

    const service = read(
      "src/core/verification/services/VerificationService.ts",
    );
    expect(service).toContain('supabase.rpc("request_profile_verification"');
    expect(service).toContain("p_profile_id: params.profile_id");
  });

  it("binds administrative decisions to an authenticated admin actor", () => {
    expect(migration).toContain("COALESCE(auth.role(), '') <> 'service_role'");
    expect(migration).toContain("private.is_admin_user(p_actor_user_id)");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");

    const edge = read("supabase/functions/admin-verify-profile/index.ts");
    expect(edge).toContain("requireAdmin(req)");
    expect(edge).toContain("p_actor_user_id: authResult.userId");
    expect(edge).toContain("review_profile_verification");
  });

  it("enforces auditable state transitions", () => {
    expect(transitionMigration).toContain("FOR UPDATE");
    expect(transitionMigration).toContain("v_row.status <> 'pending'");
    expect(transitionMigration).toContain("v_row.status <> 'approved'");
    expect(transitionMigration).toContain("v_decision IN ('reject', 'revoke')");
    expect(transitionMigration).toContain("length(v_reason) < 10");
  });

  it("keeps the identity badge as a projection and residence independent", () => {
    expect(migration).toContain("v_row.verification_type = 'document'");
    expect(migration).toContain("SET verified = v_status = 'approved'");
    expect(migration).not.toContain(
      "v_row.verification_type = 'resident' THEN",
    );
  });

  it("removes the duplicated Profile workflow and keeps Mobility decisions local", () => {
    expect(
      existsSync(
        resolve(
          root,
          "src/core/profiles/services/ProfileVerificationAdminService.ts",
        ),
      ),
    ).toBe(false);
    expect(read("src/core/profiles/services/ProfileService.ts")).not.toContain(
      "getProfilesByVerificationStatus",
    );
    expect(
      read("src/core/profiles/services/profile.mutations.ts"),
    ).not.toContain("updateVerificationStatus");
    expect(
      read("src/core/admin/services/AdminDriverModerationService.ts"),
    ).toContain("listLatestDecisionsByDriverProfiles");
  });
});
