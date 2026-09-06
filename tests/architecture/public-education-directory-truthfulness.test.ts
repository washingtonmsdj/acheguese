import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 public Education directory truthfulness", () => {
  it("does not convert publication or missing data into verification/facts", () => {
    const detail = read(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );
    const sidebar = read(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );
    const presentation = read(
      "src/modules/business/education/pages/EducationDetailPresentationData.ts",
    );

    expect(detail).not.toContain("profile.status === 'published'");
    expect(detail).toContain("Cadastro público");
    expect(detail).toContain("schoolManagementLabel");
    expect(detail).toContain("profile?.enrollment_open === true");
    expect(detail).toContain("Infraestrutura ainda não confirmada por fonte confiável");
    expect(detail).toContain("Modalidades ainda não informadas por fonte confiável");

    expect(sidebar).toContain("isPublicDirectoryProfile");
    expect(sidebar).toContain("não coleta dados de responsável ou aluno");
    expect(presentation).not.toContain("oferecemos periodo de adaptacao");
    expect(presentation).toContain(
      "A ausencia de um item significa apenas que ele ainda nao foi confirmado",
    );
  });

  it("keeps browser Education reads on the sanitized public read model", () => {
    const queries = read("src/core/education/services/education.queries.ts");
    const publicReadModelCalls =
      queries.match(/\.from\('public_business_search'\)/g) ?? [];

    expect(publicReadModelCalls).toHaveLength(3);
    expect(queries).not.toContain(".from('business_data')");
  });

  it("preserves unknown seed fields and supports parking without fabricating it", () => {
    const unknownRepair = read(
      "supabase/migrations/20260906075625_repair_public_education_unknown_semantics_g6.sql",
    );
    const parkingMigration = read(
      "supabase/migrations/20260906080244_expand_education_parking_facilities_g6.sql",
    );
    const contracts = read("src/core/education/contracts.ts");
    const filters = read(
      "src/modules/business/education/pages/explorerFilters.ts",
    );

    expect(unknownRepair).toContain("source_backed_partial");
    expect(unknownRepair).toContain("'infrastructure_evidence_status', 'unknown'");
    expect(unknownRepair).toContain(
      "enrollment_open = CASE WHEN ep.enrollment_open = false THEN NULL",
    );

    expect(parkingMigration).toContain("'parking'");
    expect(parkingMigration).toContain("'accessible_parking'");
    expect(contracts).toContain("| 'parking'");
    expect(contracts).toContain("| 'accessible_parking'");
    expect(filters).toContain("facilities.includes('parking')");
  });
});
