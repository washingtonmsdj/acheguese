import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business coverage identity and delegated authority (G6)", () => {
  it("uses business_data.id as the canonical coverage entity id", () => {
    const mapper = read("src/core/business/services/business.mappers.ts");
    const service = read(
      "src/modules/business/services/BusinessCoverageService.ts",
    );
    const editor = read("src/modules/business/pages/EditarEmpresaPage.tsx");
    const hero = read(
      "src/modules/business/company/sections/EmpresaHeroSection.tsx",
    );

    expect(mapper).toContain("id: data.profile_id || data.id");
    expect(mapper).toContain("business_data_id: data.id");

    expect(service).toContain("entity_id: businessDataId");
    expect(service).not.toContain("entity_id: businessId");

    expect(editor).toContain(
      "businessDataId={business.business_data_id}",
    );
    expect(editor).not.toContain("businessId={business.id}");

    expect(hero).toContain(
      "businessDataId={business.business_data_id}",
    );
    expect(hero).not.toContain("businessId={business.id}");
  });

  it("keeps delegated coverage writes on the canonical profile management authority", () => {
    const migration = read(
      "supabase/migrations/20260906112658_allow_delegated_business_coverage_g6.sql",
    );

    expect(migration).toContain("FROM public.business_data business");
    expect(migration).toContain("WHERE business.id = p_entity_id");
    expect(migration).toContain(
      "business.profile_id = v_actor_profile_id",
    );
    expect(migration).toContain(
      "private.can_manage_profile(business.profile_id)",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.require_coverage_entity_write(TEXT, UUID)",
    );
  });
});
