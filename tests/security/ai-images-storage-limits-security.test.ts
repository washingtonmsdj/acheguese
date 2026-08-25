import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BASELINE = "20260818223025_harden_ai_images_storage_limits.sql";

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

describe("SEC-005 ai-images storage limits", () => {
  it("keeps the canonical public image-only bucket contract versioned", () => {
    const baseline = migrationsFromBaseline().find(({ name }) => name === BASELINE);
    expect(baseline, `${BASELINE} must remain versioned`).toBeDefined();

    const sql = baseline?.sql ?? "";
    expect(sql).toContain("bucket_id = 'ai-images'");
    expect(sql).toMatch(/public\s*=\s*true/i);
    expect(sql).toMatch(/file_size_limit\s*=\s*10485760/i);
    expect(sql).toContain("'image/jpeg'");
    expect(sql).toContain("'image/png'");
    expect(sql).toContain("'image/webp'");
  });

  it("does not silently remove the ai-images size or MIME limits", () => {
    const regressions = migrationsFromBaseline()
      .filter(({ name }) => name !== BASELINE)
      .filter(({ sql }) => /['\"]ai-images['\"]/i.test(sql))
      .filter(({ sql }) =>
        /file_size_limit\s*=\s*null/i.test(sql) ||
        /allowed_mime_types\s*=\s*null/i.test(sql),
      )
      .map(({ name }) => name);

    expect(regressions, "ai-images must remain bounded and image-only").toEqual([]);
  });

  it("does not accidentally privatize the deliberately public CDN bucket", () => {
    const regressions = migrationsFromBaseline()
      .filter(({ name }) => name !== BASELINE)
      .filter(({ sql }) => /['\"]ai-images['\"]/i.test(sql))
      .filter(({ sql }) => /public\s*=\s*false/i.test(sql))
      .map(({ name }) => name);

    expect(
      regressions,
      "ai-images public CDN behavior is an explicit product contract and requires deliberate review to change",
    ).toEqual([]);
  });
});
