import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE =
  "20260830053058_revoke_legacy_trigger_direct_execute.sql";

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 legacy trigger direct-execute authority", () => {
  it("keeps prevent_legacy_writes trigger-only and non-callable by application roles", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toContain("v_return_type::text <> 'trigger'");
    expect(sql).toMatch(
      /REVOKE\s+ALL\s+PRIVILEGES\s+ON\s+FUNCTION\s+public\.prevent_legacy_writes\(\)\s+FROM\s+PUBLIC\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role/i,
    );
    expect(sql).toContain("expected exactly 2 active legacy triggers");
    expect(sql).toContain("legacy write-protection triggers were not preserved");
  });

  it("rejects future direct grants on the trigger-only helper", () => {
    const offenders = migrationsAfterBaseline()
      .filter(({ sql }) =>
        new RegExp(
          String.raw`GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.prevent_legacy_writes\(\)\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b|\bauthenticated\b|\bservice_role\b)`,
          "i",
        ).test(sql),
      )
      .map(({ name }) => name);

    expect(
      offenders,
      "trigger-only legacy guard must not regain direct application-role EXECUTE",
    ).toEqual([]);
  });
});
