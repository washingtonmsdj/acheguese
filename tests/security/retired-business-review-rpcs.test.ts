import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const RETIREMENT = "20260830033012_retire_dormant_business_review_rpcs.sql";
const RETIRED = [
  "can_user_review_business",
  "create_business_review",
  "update_business_review",
  "delete_business_review",
  "add_business_review_response",
  "get_business_reviews",
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

describe("G5 retired Business Review RPCs", () => {
  it("keeps every dormant RPC explicitly retired without CASCADE", () => {
    const sql = readFileSync(join(MIGRATIONS, RETIREMENT), "utf8");

    for (const functionName of RETIRED) {
      expect(sql).toMatch(
        new RegExp(
          `DROP\\s+FUNCTION\\s+IF\\s+EXISTS\\s+public\\.${functionName}\\s*\\(`,
          "i",
        ),
      );
    }

    expect(sql).not.toMatch(/DROP\s+FUNCTION[\s\S]*?\bCASCADE\b/i);
  });

  it("rejects future recreation or grants for retired RPC names", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterRetirement()) {
      for (const functionName of RETIRED) {
        const creates = new RegExp(
          `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${functionName}\\s*\\(`,
          "i",
        );
        const grants = new RegExp(
          `GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.${functionName}\\s*\\(`,
          "i",
        );

        if (creates.test(sql)) offenders.push(`${name}: recreate ${functionName}`);
        if (grants.test(sql)) offenders.push(`${name}: grant ${functionName}`);
      }
    }

    expect(
      offenders,
      "retired Business Review RPCs require a new architecture decision before returning",
    ).toEqual([]);
  });
});
