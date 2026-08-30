import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const RETIREMENT = "20260830095958_retire_empty_legacy_business_views.sql";

function migrationsAfterRetirement() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > RETIREMENT)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 retired legacy business_views", () => {
  it("retires the empty legacy ledger fail-closed without CASCADE", () => {
    const sql = readFileSync(join(MIGRATIONS, RETIREMENT), "utf8");

    expect(sql).toMatch(/DROP\s+TABLE\s+public\.business_views\s+RESTRICT/i);
    expect(sql).toMatch(/public\.business_views contains rows/i);
    expect(sql).not.toMatch(/\bCASCADE\b/i);
  });

  it("rejects future recreation of business_views", () => {
    const offenders = migrationsAfterRetirement()
      .filter(({ sql }) =>
        /CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.business_views\b/i.test(
          sql,
        ),
      )
      .map(({ name }) => name);

    expect(
      offenders,
      "business_views may return only after a new SSOT architecture decision",
    ).toEqual([]);
  });
});
