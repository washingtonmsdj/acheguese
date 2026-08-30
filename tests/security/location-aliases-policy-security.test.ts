import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE =
  "20260830044728_remove_location_aliases_public_read_shadow.sql";
const OBSOLETE_POLICY = "Location aliases public read";

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 location_aliases RLS authority", () => {
  it("removes the obsolete public-read shadow only after requiring the canonical policy", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toContain("policyname = 'location_aliases_public_read'");
    expect(sql).toContain(`DROP POLICY IF EXISTS \"${OBSOLETE_POLICY}\"`);
    expect(sql).toContain("canonical public read authority was not preserved");
  });

  it("rejects future recreation of the obsolete policy name", () => {
    const offenders = migrationsAfterBaseline()
      .filter(({ sql }) =>
        new RegExp(
          String.raw`CREATE\s+POLICY\s+\"?${OBSOLETE_POLICY.replaceAll(" ", String.raw`\s+`)}\"?\s+ON\s+(?:public\.)?location_aliases`,
          "i",
        ).test(sql),
      )
      .map(({ name }) => name);

    expect(
      offenders,
      "the superseded Location aliases public read policy must not return alongside location_aliases_public_read",
    ).toEqual([]);
  });
});
