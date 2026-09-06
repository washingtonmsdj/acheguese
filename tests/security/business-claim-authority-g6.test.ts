import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 business claim authority", () => {
  it("binds claims to canonical business_data and reuses the Profile ownership authority", () => {
    const baseMigration = read(
      "supabase/migrations/20260906082751_reconcile_business_claim_authority_g6.sql",
    );
    const transferMigration = read(
      "supabase/migrations/20260906124554_fix_business_claim_canonical_transfer_g6.sql",
    );

    expect(baseMigration).toContain("REFERENCES public.business_data(id)");
    expect(baseMigration).not.toContain(
      'CREATE POLICY "Admins manage all claims"',
    );

    expect(transferMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.profile_transfer_ownership_core",
    );
    expect(transferMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.profile_transfer_ownership(",
    );
    expect(transferMigration).toContain(
      "SELECT private.profile_transfer_ownership_core(",
    );
    expect(transferMigration).toContain(
      "v_transfer_result := private.profile_transfer_ownership_core(",
    );
    expect(transferMigration).toContain(
      "p_keep_previous_owner_as_manager boolean",
    );
    expect(transferMigration).toContain(
      "previous_owner_active', p_keep_previous_owner_as_manager",
    );
    expect(transferMigration).toContain(
      "'previous_custodian_user_id', v_current_owner_user_id",
    );

    const adminResolver = transferMigration.slice(
      transferMigration.indexOf(
        "CREATE OR REPLACE FUNCTION public.admin_resolve_business_claim",
      ),
    );
    expect(adminResolver).not.toContain(
      "UPDATE public.profiles\n    SET user_id = v_claim.user_id",
    );
    expect(adminResolver).not.toContain(
      "INSERT INTO public.profile_members (\n      profile_id, user_id, role, joined_at",
    );
  });

  it("requires bounded official evidence for public Education claims", () => {
    const evidenceMigration = read(
      "supabase/migrations/20260906123911_harden_public_education_claim_evidence_g6.sql",
    );
    const requestabilityMigration = read(
      "supabase/migrations/20260906124739_route_business_claim_requestability_through_helper_g6.sql",
    );
    const claimService = read(
      "src/core/business/services/BusinessClaimService.ts",
    );
    const educationSidebar = read(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );
    const adminClaims = read(
      "src/modules/admin/pages/AdminReivindicacoes.tsx",
    );

    expect(evidenceMigration).toContain(
      "private.business_claim_has_official_evidence",
    );
    expect(evidenceMigration).toContain("'official_source_url'");
    expect(evidenceMigration).toContain(
      "public_education_claim_requires_review_notes",
    );

    expect(requestabilityMigration).toContain(
      "CREATE OR REPLACE FUNCTION private.business_claim_is_requestable",
    );
    expect(requestabilityMigration).toContain("SECURITY DEFINER");
    expect(requestabilityMigration).toContain(
      "private.business_claim_is_requestable(\n    business_claims.business_id,",
    );
    expect(requestabilityMigration).not.toContain(
      "WHERE bd_public.id = business_id",
    );

    expect(claimService).toContain(
      "const user = await SessionService.getCurrentUser()",
    );
    expect(claimService).not.toContain("userId: string");
    expect(claimService).toContain('kind: "official_source_url"');
    expect(claimService).toContain("officialEvidenceUrls?: string[]");
    expect(claimService).toContain("documents,");

    expect(educationSidebar).toContain(
      "Solicitar administracao institucional",
    );
    expect(educationSidebar).toContain(
      "Fonte oficial para comprovar autoridade institucional",
    );
    expect(educationSidebar).toContain("officialEvidenceUrls:");

    expect(adminClaims).toContain("getOfficialEvidenceUrls");
    expect(adminClaims).toContain('claim.school_type === "public"');
    expect(adminClaims).toContain(
      "Registre uma justificativa de revisão com pelo menos 10 caracteres.",
    );
    expect(adminClaims).toContain(
      "A aprovação transfere a autoridade real do perfil.",
    );
  });

  it("routes claim resolution through the authenticated admin broker", () => {
    const edge = read("supabase/functions/admin-business-rpc/index.ts");
    const admin = read("src/core/business/services/business.admin.ts");

    expect(edge).toContain("resolveClaim: true");
    expect(edge).toContain("admin_resolve_business_claim");
    expect(edge).toContain("p_actor_user_id: auth.userId");
    expect(edge).toContain("public_education_claim_requires_documents");
    expect(edge).toContain("public_education_claim_requires_review_notes");

    expect(admin).toContain('action: "resolveClaim"');
    expect(admin).toContain("reviewNotes: reviewNotes?.trim() || null");
    expect(admin).not.toContain('.from<{ id: string }>("business_claims")');
  });

  it("publishes only sanitized claimability and keeps old businesses fail-closed", () => {
    const projection = read(
      "supabase/migrations/20260906083025_project_business_claimability_read_model_g6.sql",
    );
    const queries = read("src/core/education/services/education.queries.ts");

    expect(projection).toContain(
      "is_claimable boolean NOT NULL DEFAULT false",
    );
    expect(projection).toContain("COALESCE(");
    expect(queries).toContain("is_claimable");
    expect(queries).toContain("business_data_id");
  });
});
