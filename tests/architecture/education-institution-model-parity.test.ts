import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Education institution model parity", () => {
  it("uses explicit Brazilian EJA vocabulary in current source", () => {
    const contracts = read("src/core/education/contracts.ts");
    const setup = read(
      "src/modules/business/education/pages/EducationSetupPage.model.ts",
    );
    const stages = read("src/core/education/constants/schoolStageOptions.ts");
    const repair = read(
      "supabase/migrations/20260906082050_canonicalize_education_eja_level_g6.sql",
    );

    expect(contracts).toContain("'youth_adult_education'");
    expect(contracts).not.toContain("| 'middle_school'");
    expect(setup).toContain("'youth_adult_education'");
    expect(stages).toContain("educationLevel: 'youth_adult_education'");
    expect(repair).toContain("array_replace");
    expect(repair).toContain("'middle_school'");
  });

  it("keeps physical infrastructure independent from public/private ownership", () => {
    const setup = read(
      "src/modules/business/education/pages/EducationSetupPage.model.ts",
    );
    const sections = read(
      "src/modules/business/education/pages/EducationSetupSections.tsx",
    );
    const detail = read(
      "src/modules/business/education/pages/EducationDetailPage.tsx",
    );

    expect(setup).toContain(
      "['regular_school', 'daycare', 'technical_school']",
    );
    expect(setup).not.toContain("value: 'university'");
    expect(sections).toContain('title="Instalacoes"');
    expect(detail).not.toContain(
      "profile.niche_key === 'regular_school' &&",
    );
  });

  it("supports structured subjects/modules for every education program", () => {
    const contracts = read("src/core/education/contracts.ts");
    const service = read(
      "src/modules/business/education/services/EducationService.ts",
    );
    const page = read(
      "src/modules/business/education/pages/EducationProgramsPage.tsx",
    );
    const migration = read(
      "supabase/migrations/20260906082420_add_education_program_curriculum_topics_g6.sql",
    );

    expect(contracts).toContain("curriculum_topics?: string[] | null");
    expect(service).toContain("curriculum_topics: payload.curriculumTopics");
    expect(page).toContain("Disciplinas / conteúdos");
    expect(migration).toContain("cardinality(curriculum_topics) <= 50");
  });
});
