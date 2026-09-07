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

  it("routes institutional grant and revoke through the existing authenticated admin broker", () => {
    const edge = read("supabase/functions/admin-business-rpc/index.ts");
    const admin = read("src/core/business/services/business.admin.ts");

    expect(edge).toContain("grantInstitutionScope: true");
    expect(edge).toContain("revokeInstitutionScope: true");
    expect(edge).toContain("const auth = await requireAdmin(req)");
    expect(edge).toContain("admin_grant_business_institution_scope");
    expect(edge).toContain("admin_revoke_business_institution_scope");
    expect(edge).toContain("p_actor_user_id: auth.userId");
    expect(edge).toContain("cleanHttpUrl(params.evidenceUrl");
    expect(edge).toContain("cleanText(params.grantReason");
    expect(edge).toContain("cleanText(\n        params.revocationReason");

    expect(admin).toContain('action: "grantInstitutionScope"');
    expect(admin).toContain('action: "revokeInstitutionScope"');
    expect(admin).toContain('functionName: "admin-business-rpc"');
    expect(admin).not.toContain(
      '.from("profile_institution_management_scopes")',
    );
  });

  it("keeps the admin UI on the canonical Business/Admin facade chain", () => {
    const readModelMigration = read(
      "supabase/migrations/20260907010116_add_business_institution_scope_admin_model_g6.sql",
    );
    const edge = read("supabase/functions/admin-business-rpc/index.ts");
    const businessFacade = read("src/core/business/services/BusinessService.ts");
    const adminService = read("src/core/admin/services/AdminBusinessService.ts");
    const ui = read("src/modules/admin/pages/AdminInstitutionScopes.tsx");
    const businessesPage = read("src/modules/admin/pages/AdminBusinessesPage.tsx");

    expect(readModelMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.admin_get_business_institution_scope_model",
    );
    expect(readModelMigration).toContain(
      "FROM PUBLIC, anon, authenticated;",
    );
    expect(readModelMigration).toContain("TO service_role;");
    expect(readModelMigration).toContain(
      "FROM private.profile_institution_management_scopes scope",
    );

    expect(edge).toContain("getInstitutionScopeAdminModel: true");
    expect(edge).toContain("admin_get_business_institution_scope_model");
    expect(edge).toContain("p_actor_user_id: auth.userId");

    expect(businessFacade).toContain(
      "getBusinessInstitutionScopeAdminModel",
    );
    expect(adminService).toContain("getInstitutionScopeAdminModel");
    expect(adminService).toContain(
      "BusinessService.getBusinessInstitutionScopeAdminModel()",
    );

    expect(ui).toContain("adminBusinessService.getInstitutionScopeAdminModel()");
    expect(ui).toContain("adminBusinessService.grantInstitutionScope");
    expect(ui).toContain("adminBusinessService.revokeInstitutionScope");
    expect(ui).not.toContain("supabase.from(");
    expect(ui).not.toContain(".rpc(");
    expect(businessesPage).toContain("<AdminInstitutionScopes />");
  });

  it("keeps deletion of the Education identity structural-owner-only", () => {
    const deleteBoundary = read(
      "supabase/migrations/20260907011809_restrict_education_profile_delete_to_structural_owner_g6.sql",
    );

    expect(deleteBoundary).toContain(
      "DROP POLICY IF EXISTS education_profiles_owner_all",
    );
    expect(deleteBoundary).toContain(
      "CREATE POLICY education_profiles_manager_update",
    );
    expect(deleteBoundary).toContain(
      "private.can_operate_business_profile(business_id)",
    );
    expect(deleteBoundary).toContain(
      "CREATE POLICY education_profiles_structural_owner_delete",
    );
    expect(deleteBoundary).toContain(
      "p.user_id = (SELECT auth.uid())",
    );

    const deletePolicy =
      deleteBoundary.split(
        "CREATE POLICY education_profiles_structural_owner_delete",
      )[1] ?? "";
    expect(deletePolicy).not.toContain("can_manage_profile");
    expect(deletePolicy).not.toContain("can_operate_business_profile");
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
