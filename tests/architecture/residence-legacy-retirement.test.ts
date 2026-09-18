import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Residence legacy migration retirement", () => {
  it("does not keep the completed one-shot migration surface", () => {
    for (const retiredPath of [
      "src/core/residence/MIGRATION_GUIDE.md",
      "src/core/residence/migrations/migrateUserResidencesToCanonical.ts",
      "src/core/residence/migrations/runMigration.ts",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }
  });

  it("exposes only the canonical runtime API", () => {
    const barrel = read("src/core/residence/index.ts");
    const service = read("src/core/residence/services/ResidenceService.ts");

    expect(barrel).not.toContain("migrateUserResidencesToCanonical");
    expect(barrel).not.toContain("formatMigrationReport");
    expect(service).not.toContain("isMigrated(");
    expect(service).not.toContain("Sempre true");
  });

  it("keeps live documentation aligned with the canonical schema", () => {
    const readme = read("src/core/residence/README.md");

    expect(readme).toContain("address_id");
    expect(readme).toContain("location_id");
    expect(readme).toContain("FK obrigatória");
    expect(readme).not.toContain("Compatibilidade Transitória");
    expect(readme).not.toContain("Modelo legado");
    expect(readme).not.toContain("Script de Migração");
    expect(readme).not.toContain("Campos legados mantidos");
  });
});
