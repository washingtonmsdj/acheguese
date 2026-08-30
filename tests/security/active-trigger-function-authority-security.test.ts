import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE =
  "20260830053258_revoke_direct_execute_from_active_trigger_functions.sql";

function migrationFiles() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

function migrationsAfterBaseline() {
  return migrationFiles()
    .filter((name) => name > BASELINE)
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

function collectTriggerFunctionNames(sql: string, names: Set<string>) {
  const triggerDefinition =
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:(?:public)\.)?"?([a-zA-Z0-9_]+)"?\s*\([^;]*?\)\s*RETURNS\s+TRIGGER\b/gi;

  for (const match of sql.matchAll(triggerDefinition)) {
    names.add(match[1].toLowerCase());
  }
}

function triggerFunctionsKnownAtBaseline() {
  const names = new Set<string>();
  for (const name of migrationFiles().filter((file) => file <= BASELINE)) {
    collectTriggerFunctionNames(readFileSync(join(MIGRATIONS, name), "utf8"), names);
  }
  return names;
}

describe("G5 active trigger-function authority", () => {
  it("revokes application-role EXECUTE without changing active trigger bindings", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toContain("p.prorettype = 'pg_catalog.trigger'::regtype");
    expect(sql).toContain("v_after_bindings <> v_before_bindings");
    expect(sql).toContain("FROM PUBLIC, anon, authenticated, service_role");
    expect(sql).toContain("v_remaining_exposed <> 0");
  });

  it("rejects future direct application-role grants only for known trigger functions", () => {
    const knownTriggerFunctions = triggerFunctionsKnownAtBaseline();
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      collectTriggerFunctionNames(sql, knownTriggerFunctions);

      const grantsExecute =
        /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+(?:(?:public)\.)?"?([a-zA-Z0-9_]+)"?\s*\([^;]*?\)\s+TO\s+([^;]+);/gi;

      for (const match of sql.matchAll(grantsExecute)) {
        const functionName = match[1].toLowerCase();
        const grantees = match[2];
        if (
          knownTriggerFunctions.has(functionName) &&
          /\b(?:PUBLIC|anon|authenticated|service_role)\b/i.test(grantees)
        ) {
          offenders.push(`${name}: ${functionName}`);
        }
      }
    }

    expect(
      offenders,
      "known trigger-only functions must not regain direct application-role EXECUTE without an explicit G5 architecture decision",
    ).toEqual([]);
  });
});
