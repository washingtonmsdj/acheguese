import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RLS auth initplan regression migration", () => {
  const migration = readFileSync(
    "supabase/migrations/20260926004700_fix_rls_auth_initplan_regression.sql",
    "utf8",
  );

  it("optimizes the six policies currently reported by the Supabase advisor", () => {
    for (const policy of [
      "business_direct_reports_own_or_admin_select",
      "vaga_applications_insert",
      "vagas_owner_create",
      "vagas_owner_delete",
      "vagas_owner_read",
      "vagas_owner_update",
    ]) {
      expect(migration).toContain(`ALTER POLICY \"${policy}\"`);
    }
  });

  it("evaluates auth.uid once per statement instead of once per candidate row", () => {
    expect(migration).toContain("(SELECT auth.uid())");
    expect(migration).not.toContain("is_admin_user(auth.uid())");
    expect(migration).not.toContain("p.user_id = auth.uid()");
  });

  it("does not relax the existing vagas publishing and ownership boundaries", () => {
    expect(migration).toContain("private.can_manage_profile(owner_profile_id)");
    expect(migration).toContain("p.profile_type = 'business'");
    expect(migration).toContain("COALESCE(b.can_post_vagas, true) = true");
    expect(migration).toContain("v.status = 'published'::public.vaga_status");
    expect(migration).toContain("v.owner_profile_id <> vaga_applications.candidato_profile_id");
  });
});
