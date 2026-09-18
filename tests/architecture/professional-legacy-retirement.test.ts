import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Professional legacy retirement", () => {
  it("does not keep completed migration or compatibility owners", () => {
    for (const retiredPath of [
      "src/core/professional/MIGRATION_GUIDE.md",
      "src/core/professional/migrations/migrateProfessionalDataToCanonical.ts",
      "src/core/professional/migrations/runMigration.ts",
      "src/core/professional/services/ProfessionalCanonicalAdapter.ts",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }
  });

  it("keeps ProfessionalService free of migration-state wrappers", () => {
    const service = read("src/core/professional/services/ProfessionalService.ts");
    const barrel = read("src/core/professional/index.ts");

    expect(service).not.toContain("ProfessionalCanonicalAdapter");
    expect(service).not.toContain("isProfessionalMigrated");
    expect(service).not.toContain("hasPhysicalAddressCanonical");
    expect(barrel).not.toContain("migrateProfessionalDataToCanonical");
    expect(barrel).not.toContain("ProfessionalCanonicalAdapter");
  });

  it("does not project location from retired professional metadata", () => {
    const mapper = read("src/core/professional/services/professional.mappers.ts");
    const types = read("src/core/professional/types.ts");
    const metadataStart = types.indexOf("export interface ProfessionalMetadata");
    const metadataEnd = types.indexOf("// APPLICATION TYPES", metadataStart);
    const metadataSection = types.slice(metadataStart, metadataEnd);

    expect(mapper).not.toContain("metadata.location");
    expect(mapper).not.toContain("metadata.latitude");
    expect(mapper).not.toContain("metadata.longitude");
    expect(metadataSection).not.toContain("portfolio_images?:");
    expect(metadataSection).not.toContain("location?:");
    expect(metadataSection).not.toContain("[key: string]: unknown");
  });

  it("keeps professional metadata closed and non-duplicated on writes", () => {
    const lifecycle = read(
      "src/core/professional/services/professional.profile-lifecycle.ts",
    );

    expect(lifecycle).toContain("copyCanonicalProfessionalMetadata");
    expect(lifecycle).not.toContain("{ ...(options.currentMetadata ?? {}) }");
    expect(lifecycle).not.toContain("category: validatedInput.category");
    expect(lifecycle).not.toContain("price_range: validatedInput.price_range");
    expect(lifecycle).not.toContain(
      "available_hours: validatedInput.available_hours",
    );
  });

  it("keeps live documentation canonical-only", () => {
    const readme = read("src/core/professional/README.md");

    expect(readme).toContain("location_id");
    expect(readme).toContain("address_id");
    expect(readme).not.toContain("Modelo legado");
    expect(readme).not.toContain("Script de Migração");
    expect(readme).not.toContain("isProfessionalMigrated");
    expect(readme).not.toContain("metadata.location");
  });
});
