import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const PRIVACY_BASELINE = "20260818205318_make_safety_evidence_bucket_private.sql";

function migrationsFromPrivacyBaseline(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => name >= PRIVACY_BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

describe("SEC-001 safety-evidence storage invariant", () => {
  it("keeps the canonical bucket privacy migration present", () => {
    const migrations = migrationsFromPrivacyBaseline();
    const baseline = migrations.find(({ name }) => name === PRIVACY_BASELINE);

    expect(baseline, `${PRIVACY_BASELINE} must remain versioned`).toBeDefined();
    expect(baseline?.sql).toContain("'safety-evidence'");
    expect(baseline?.sql).toMatch(/public\s*=\s*false/i);
  });

  it("does not reopen safety-evidence as a public bucket", () => {
    const regressions = migrationsFromPrivacyBaseline()
      .filter(({ sql }) => sql.includes("safety-evidence"))
      .filter(({ sql }) => /public\s*=\s*true/i.test(sql))
      .map(({ name }) => name);

    expect(regressions, "no migration may make safety-evidence public again").toEqual([]);
  });

  it("does not add an obviously permissive anonymous policy for safety-evidence", () => {
    const regressions = migrationsFromPrivacyBaseline()
      .filter(({ sql }) => sql.includes("safety-evidence"))
      .filter(({ sql }) => /create\s+policy/i.test(sql))
      .filter(({ sql }) => /\bto\s+anon\b/i.test(sql))
      .filter(
        ({ sql }) =>
          /using\s*\(\s*true\s*\)/i.test(sql) ||
          /with\s+check\s*\(\s*true\s*\)/i.test(sql),
      )
      .map(({ name }) => name);

    expect(
      regressions,
      "anonymous access to safety-evidence requires an explicit reviewed authority model",
    ).toEqual([]);
  });
});
