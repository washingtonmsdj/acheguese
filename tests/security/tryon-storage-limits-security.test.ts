import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const LIMIT_BASELINE = "20260818220456_harden_tryon_storage_limits.sql";

function migrationsFromLimitBaseline(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => name >= LIMIT_BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

describe("SEC-005 tryon storage limits invariant", () => {
  it("keeps the canonical tryon hardening migration present", () => {
    const baseline = migrationsFromLimitBaseline().find(({ name }) => name === LIMIT_BASELINE);

    expect(baseline, `${LIMIT_BASELINE} must remain versioned`).toBeDefined();
    expect(baseline?.sql).toContain("bucket_id = 'tryon'");
    expect(baseline?.sql).toMatch(/file_size_limit\s*=\s*10485760/i);
    expect(baseline?.sql).toContain("'image/jpeg'");
    expect(baseline?.sql).toContain("'image/png'");
    expect(baseline?.sql).toContain("'image/webp'");
  });

  it("does not remove the tryon file-size limit", () => {
    const regressions = migrationsFromLimitBaseline()
      .filter(({ name }) => name !== LIMIT_BASELINE)
      .filter(({ sql }) => /['\"]tryon['\"]/i.test(sql))
      .filter(({ sql }) => /file_size_limit\s*=\s*null/i.test(sql))
      .map(({ name }) => name);

    expect(regressions, "tryon must not become unbounded again without explicit review").toEqual([]);
  });

  it("does not remove the tryon MIME allowlist", () => {
    const regressions = migrationsFromLimitBaseline()
      .filter(({ name }) => name !== LIMIT_BASELINE)
      .filter(({ sql }) => /['\"]tryon['\"]/i.test(sql))
      .filter(({ sql }) => /allowed_mime_types\s*=\s*null/i.test(sql))
      .map(({ name }) => name);

    expect(regressions, "tryon MIME restrictions must remain explicit").toEqual([]);
  });
});
