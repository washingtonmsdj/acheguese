import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BASELINE = "20260818221645_dedupe_rls_policy_encoding_artifacts.sql";

const CORRUPTED_POLICY_NAMES = [
  "Links premium s??o p??blicos",
  "Empresas podem ver suas pr??prias assinaturas",
] as const;

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("SEC-008 RLS policy encoding cleanup", () => {
  it("keeps the remote encoding cleanup migration versioned", () => {
    const baseline = migrationsFromBaseline().find(({ name }) => name === BASELINE);
    expect(baseline, `${BASELINE} must remain versioned`).toBeDefined();
    expect(baseline?.sql).toContain("Links premium são públicos");
    expect(baseline?.sql).toContain("Empresas podem ver suas próprias assinaturas");
  });

  it("does not recreate corrupted policy names later", () => {
    const later = migrationsFromBaseline().filter(({ name }) => name !== BASELINE);
    const regressions: string[] = [];

    for (const { name, sql } of later) {
      for (const policy of CORRUPTED_POLICY_NAMES) {
        const createPolicy = new RegExp(
          `create\\s+policy\\s+["']?${escapeRegex(policy)}["']?`,
          "i",
        );
        if (createPolicy.test(sql)) regressions.push(`${name}: ${policy}`);
      }
    }

    expect(regressions, "corrupted duplicate policy names must stay removed").toEqual([]);
  });
});
