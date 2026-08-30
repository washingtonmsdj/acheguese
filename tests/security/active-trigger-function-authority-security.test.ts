import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE =
  "20260830053258_revoke_direct_execute_from_active_trigger_functions.sql";

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 active trigger-function authority", () => {
  it("revokes application-role EXECUTE without changing active trigger bindings", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toContain("p.prorettype = 'pg_catalog.trigger'::regtype");
    expect(sql).toContain("v_after_bindings <> v_before_bindings");
    expect(sql).toContain("FROM PUBLIC, anon, authenticated, service_role");
    expect(sql).toContain("v_remaining_exposed <> 0");
  });

  it("rejects future direct application-role grants on trigger functions", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      const grantsTriggerExecute = new RegExp(
        String.raw`GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+[^;]+\(\)\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b|\bauthenticated\b|\bservice_role\b)`,
        "i",
      );
      if (grantsTriggerExecute.test(sql)) {
        offenders.push(name);
      }
    }

    expect(
      offenders,
      "active trigger functions are internal hooks and must not regain direct application-role EXECUTE without an explicit G5 architecture decision",
    ).toEqual([]);
  });
});
