import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 business profile factual corrections", () => {
  it("keeps factual corrections separate from abuse reports", () => {
    const migration = read(
      "supabase/migrations/20260906091527_add_business_profile_corrections_g6.sql",
    );
    const service = read(
      "src/core/business/services/BusinessProfileCorrectionService.ts",
    );

    expect(migration).toContain("business_profile_corrections");
    expect(migration).toContain("managed_profile_should_be_edited_directly");
    expect(service).toContain('rpc(\n      "create_business_profile_correction"');
    expect(service).not.toContain("business_profile_reports");
  });

  it("auto-applies only fields with deterministic SSOT mappings", () => {
    const migration = read(
      "supabase/migrations/20260906104918_add_business_fact_provenance_g6.sql",
    );
    const service = read(
      "src/core/business/services/BusinessProfileCorrectionService.ts",
    );

    expect(migration).toContain("business_profile_correction_requires_manual_application");
    expect(migration).toContain("SET business_name = v_value");
    expect(migration).toContain("SET school_inep_code = v_value");
    expect(migration).toContain("set enrollment_open = v_enrollment");
    expect(migration).toContain("private.record_business_profile_fact_provenance");
    expect(migration).toContain("'community_correction'");
    expect(migration).toContain("'verified'");
    expect(service).toContain('{ id: "address", label: "Endereco", autoApply: false }');
    expect(service).toContain('{ id: "inep_code", label: "Codigo INEP", autoApply: true }');
  });

  it("offers a public correction action and an admin data-quality queue", () => {
    const sidebar = read(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );
    const admin = read("src/modules/admin/pages/AdminDataQuality.tsx");
    const routes = read("src/app/routes/sections/AdminRoutes.tsx");
    const nav = read("src/modules/admin/config/adminNavigation.config.ts");

    expect(sidebar).toContain("Sugerir correcao");
    expect(sidebar).toContain("BusinessProfileCorrectionDialog");
    expect(admin).toContain("Aplicar ao SSOT");
    expect(admin).toContain("Revisao manual");
    expect(routes).toContain('path="qualidade-dados"');
    expect(nav).toContain('to: "/admin/qualidade-dados"');
  });
});
