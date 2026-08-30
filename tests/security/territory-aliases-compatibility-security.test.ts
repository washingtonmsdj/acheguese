import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE =
  "20260830044531_harden_territory_aliases_compatibility_view.sql";

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 territory_aliases compatibility authority", () => {
  it("keeps the compatibility view security-invoker and browser read-only", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toMatch(
      /ALTER\s+VIEW\s+public\.territory_aliases\s+SET\s*\(security_invoker\s*=\s*true\)/i,
    );
    expect(sql).toMatch(
      /REVOKE\s+ALL\s+PRIVILEGES\s+ON\s+TABLE\s+public\.territory_aliases\s+FROM\s+PUBLIC\s*,\s*anon\s*,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /GRANT\s+SELECT\s+ON\s+TABLE\s+public\.territory_aliases\s+TO\s+anon\s*,\s*authenticated/i,
    );
  });

  it("rejects future browser write grants on the compatibility view", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      const grantsBrowserWrite = new RegExp(
        String.raw`GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:INSERT|UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?public\.territory_aliases\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b|\bauthenticated\b)`,
        "i",
      );
      if (grantsBrowserWrite.test(sql)) {
        offenders.push(`${name}: browser write grant`);
      }

      const disablesSecurityInvoker = new RegExp(
        String.raw`ALTER\s+VIEW\s+public\.territory_aliases\s+(?:RESET\s*\(\s*security_invoker\s*\)|SET\s*\(\s*security_invoker\s*=\s*false\s*\))`,
        "i",
      );
      if (disablesSecurityInvoker.test(sql)) {
        offenders.push(`${name}: security_invoker disabled`);
      }
    }

    expect(
      offenders,
      "territory_aliases must remain a security-invoker read-only compatibility projection for browser roles",
    ).toEqual([]);
  });
});
