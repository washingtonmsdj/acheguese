import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
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
    expect(service).not.toContain("static getFormattedAddress(");
    expect(service).not.toContain("static getCoordinates(");
    expect(service).not.toContain("static getTerritory(");
    expect(service).not.toContain("static getTerritoryName(");
    expect(barrel).not.toContain("migrateProfessionalDataToCanonical");
    expect(barrel).not.toContain("ProfessionalCanonicalAdapter");
  });

  it("does not project territory from metadata.location", () => {
    const mapper = read("src/core/professional/services/professional.mappers.ts");

    expect(mapper).not.toContain("metadata.location");
    expect(mapper).toContain("extractTerritory(row)");
    expect(mapper).toContain("location?.geographic_path");
  });

  it("keeps the last live coordinate residue read-only and explicit", () => {
    const mapper = read("src/core/professional/services/professional.mappers.ts");
    const readme = read("src/core/professional/README.md");

    expect(mapper).toContain("optionalNumber(metadata.latitude)");
    expect(mapper).toContain("optionalNumber(metadata.longitude)");
    expect(mapper).toContain("Temporary read-only compatibility");
    expect(readme).toContain("Compatibilidade residual de coordenadas");
    expect(readme).toContain("somente de");
    expect(readme).toContain("leitura");
    expect(readme).toContain("não autoriza novas escritas");
  });

  it("keeps new writes stripping retired nested location metadata", () => {
    const lifecycle = read(
      "src/core/professional/services/professional.profile-lifecycle.ts",
    );

    expect(lifecycle).toContain("delete metadata.location");
    expect(lifecycle).toContain("delete metadata.portfolio_images");
  });

  it("keeps live documentation free of retired migration instructions", () => {
    const readme = read("src/core/professional/README.md");

    expect(readme).toContain("location_id");
    expect(readme).toContain("address_id");
    expect(readme).not.toContain("Script de Migração");
    expect(readme).not.toContain("isProfessionalMigrated");
    expect(readme).not.toContain("metadata.location");
  });
});
