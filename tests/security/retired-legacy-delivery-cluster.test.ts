import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const RETIREMENT = "20260830033337_retire_empty_legacy_delivery_cluster.sql";

const RETIRED_TABLES = [
  "delivery_requests",
  "delivery_status_history",
  "delivery_tracking",
] as const;

const RETIRED_FUNCTIONS = [
  "get_available_deliveries",
  "get_delivery_stats",
  "get_next_delivery_request_number",
  "log_delivery_status_change",
] as const;

function migrationsAfterRetirement() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > RETIREMENT)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 retired legacy Delivery cluster", () => {
  it("retires the empty cluster explicitly without CASCADE", () => {
    const sql = readFileSync(join(MIGRATIONS, RETIREMENT), "utf8");

    for (const table of RETIRED_TABLES) {
      expect(sql).toMatch(
        new RegExp(`DROP\\s+TABLE\\s+IF\\s+EXISTS\\s+public\\.${table}\\s+RESTRICT`, "i"),
      );
    }

    for (const functionName of RETIRED_FUNCTIONS) {
      expect(sql).toMatch(
        new RegExp(`DROP\\s+FUNCTION\\s+IF\\s+EXISTS\\s+public\\.${functionName}\\s*\\(`, "i"),
      );
    }

    const executableSql = sql.replace(/--[^\n]*/g, " ");
    expect(executableSql).not.toMatch(/\bCASCADE\b/i);
  });

  it("rejects future recreation of the retired cluster", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterRetirement()) {
      for (const table of RETIRED_TABLES) {
        if (
          new RegExp(
            `CREATE\\s+(?:UNLOGGED\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?public\\.${table}\\b`,
            "i",
          ).test(sql)
        ) {
          offenders.push(`${name}: table ${table}`);
        }
      }

      for (const functionName of RETIRED_FUNCTIONS) {
        if (
          new RegExp(
            `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${functionName}\\s*\\(`,
            "i",
          ).test(sql)
        ) {
          offenders.push(`${name}: function ${functionName}`);
        }
      }
    }

    expect(
      offenders,
      "retired Delivery objects require a new SSOT architecture decision before returning",
    ).toEqual([]);
  });
});
