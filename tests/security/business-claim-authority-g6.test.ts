import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 business claim authority", () => {
  it("binds claims to canonical business_data and transfers profile authority atomically", () => {
    const migration = read(
      "supabase/migrations/20260906082751_reconcile_business_claim_authority_g6.sql",
    );

    expect(migration).toContain("REFERENCES public.business_data(id)");
    expect(migration).toContain("UPDATE public.profiles");
    expect(migration).toContain("INSERT INTO public.profile_members");
    expect(migration).toContain("'owner'");
    expect(migration).toContain("'custody_status', 'claimed'");
    expect(migration).toContain("public_education_claim_requires_documents");
    expect(migration).toContain("public_education_claim_requires_review_notes");
    expect(migration).not.toContain('CREATE POLICY "Admins manage all claims"');
  });

  it("routes claim resolution through the authenticated admin broker", () => {
    const edge = read("supabase/functions/admin-business-rpc/index.ts");
    const admin = read("src/core/business/services/business.admin.ts");

    expect(edge).toContain("resolveClaim: true");
    expect(edge).toContain("admin_resolve_business_claim");
    expect(edge).toContain("p_actor_user_id: auth.userId");
    expect(admin).toContain('action: "resolveClaim"');
    expect(admin).not.toContain('.from<{ id: string }>("business_claims")');
  });

  it("publishes only sanitized claimability and keeps old businesses fail-closed", () => {
    const projection = read(
      "supabase/migrations/20260906083025_project_business_claimability_read_model_g6.sql",
    );
    const queries = read("src/core/education/services/education.queries.ts");

    expect(projection).toContain("is_claimable boolean NOT NULL DEFAULT false");
    expect(projection).toContain("COALESCE(");
    expect(queries).toContain("is_claimable");
    expect(queries).toContain("business_data_id");
  });
});
