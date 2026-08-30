import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE = "20260830032757_lock_remaining_legacy_billing_browser_surfaces.sql";

const LEGACY_TABLES = [
  "billing_plans",
  "subscription_plans",
  "business_subscriptions",
  "gastronomy_subscriptions",
] as const;

const LOCK_MIGRATIONS: Record<(typeof LEGACY_TABLES)[number], string> = {
  billing_plans: BASELINE,
  subscription_plans: BASELINE,
  business_subscriptions: BASELINE,
  gastronomy_subscriptions:
    "20260830032622_lock_legacy_gastronomy_subscriptions_surface.sql",
};

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

function tablePattern(table: string) {
  return `(?:public\\.)?${table}`;
}

describe("G5 legacy Billing surface", () => {
  it("keeps every deprecated Billing table explicitly locked from browser roles", () => {
    for (const table of LEGACY_TABLES) {
      const migration = LOCK_MIGRATIONS[table];
      const sql = readFileSync(join(MIGRATIONS, migration), "utf8");
      expect(sql, `${table} must revoke browser privileges`).toMatch(
        new RegExp(
          `REVOKE\\s+ALL\\s+PRIVILEGES\\s+ON\\s+TABLE\\s+${tablePattern(table)}\\s+FROM\\s+anon\\s*,\\s*authenticated`,
          "i",
        ),
      );
    }
  });

  it("rejects future browser grants on deprecated Billing tables", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      for (const table of LEGACY_TABLES) {
        const grantsBrowser = new RegExp(
          `GRANT\\s+[^;]+?\\s+ON\\s+(?:TABLE\\s+)?${tablePattern(table)}\\s+TO\\s+[^;]*(?:\\banon\\b|\\bauthenticated\\b|\\bPUBLIC\\b)`,
          "i",
        );
        if (grantsBrowser.test(sql)) offenders.push(`${name}: ${table} grant`);

        const browserPolicy = new RegExp(
          `CREATE\\s+POLICY[\\s\\S]{0,600}?ON\\s+${tablePattern(table)}[\\s\\S]{0,600}?TO\\s+[^;]*(?:\\banon\\b|\\bauthenticated\\b|\\bPUBLIC\\b)`,
          "i",
        );
        if (browserPolicy.test(sql)) offenders.push(`${name}: ${table} policy`);
      }
    }

    expect(
      offenders,
      "deprecated Billing tables must not regain browser authority without an explicit G5 architecture decision",
    ).toEqual([]);
  });

  it("keeps retained legacy subscription rows protected from ordinary writes", () => {
    const gastronomy = readFileSync(
      join(MIGRATIONS, LOCK_MIGRATIONS.gastronomy_subscriptions),
      "utf8",
    );
    const business = readFileSync(
      join(MIGRATIONS, LOCK_MIGRATIONS.business_subscriptions),
      "utf8",
    );

    for (const [table, sql] of [
      ["gastronomy_subscriptions", gastronomy],
      ["business_subscriptions", business],
    ] as const) {
      expect(sql, `${table} must block DELETE as well as INSERT/UPDATE`).toMatch(
        /BEFORE\s+INSERT\s+OR\s+UPDATE\s+OR\s+DELETE/i,
      );
      expect(sql).toContain("prevent_legacy_writes");
    }
  });
});
