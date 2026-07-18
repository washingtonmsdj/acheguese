import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const contract = read("src/core/classifieds/services/types.ts");
const readModel = read("src/core/classifieds/services/classifieds.read-model.ts");
const queries = read("src/core/classifieds/services/classifieds.queries.ts");
const mutations = read("src/core/classifieds/services/classifieds.mutations.ts");
const createPage = read("src/modules/classifieds/pages/NovoClassificadoPage.tsx");
const createSections = read(
  "src/modules/classifieds/pages/NovoClassificadoPageSections.tsx",
);
const migration = read(
  "supabase/migrations/20260717150000_consolidate_classifieds_territory_ssot.sql",
);
const generatedSchema = read("src/integrations/supabase/types.generated.ts");

describe("Classifieds territory SSOT", () => {
  it("exposes one canonical territory contract", () => {
    expect(contract).toContain("territory: ClassifiedTerritory");
    expect(contract).toContain("location_id: string");
    expect(contract).not.toContain("location?: string");
    expect(contract).not.toContain("neighborhood?: string");
    expect(contract).not.toContain("geographic_path?: string");
  });

  it("shares one relation projection and one mapper across reads and writes", () => {
    expect(readModel).toContain(
      "territory:locations!fk_classifieds_location_id",
    );
    expect(queries).toContain(".select(CLASSIFIED_READ_SELECT)");
    expect(mutations).toContain(".select(CLASSIFIED_READ_SELECT)");
    expect(queries).not.toContain("mapRawClassified");
    expect(mutations).not.toContain("...input");
  });

  it("does not accept a parallel free-text neighborhood in the create flow", () => {
    expect(createPage).not.toContain("setNeighborhood");
    expect(createPage).not.toContain("neighborhood:");
    expect(createSections).not.toContain('label="Bairro"');
    expect(createPage).toContain("location_id: locationId");
  });

  it("makes location_id required and removes the physical legacy column", () => {
    const classifiedsSchema = generatedSchema.slice(
      generatedSchema.indexOf("      classifieds: {"),
      generatedSchema.indexOf("      comment_likes: {"),
    );

    expect(classifiedsSchema).toContain("location_id: string");
    expect(classifiedsSchema).not.toContain("neighborhood:");
    expect(migration).toContain("v_invalid_relation_count");
    expect(migration).toContain("v_label_mismatch_count");
    expect(migration).toContain("ALTER COLUMN location_id SET NOT NULL");
    expect(migration).toContain("DROP COLUMN neighborhood");
  });
});
