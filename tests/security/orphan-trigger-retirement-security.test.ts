import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const BASELINE = "20260830053822_retire_orphan_trigger_helpers.sql";
const RETIRED = [
  "auto_log_pii_access",
  "handle_new_user_profile",
  "sync_comment_likes_count",
  "update_tourist_points_v2_updated_at",
] as const;

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 orphan trigger retirement", () => {
  it("retires only zero-binding helpers after proving canonical replacements", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toContain("v_trigger_count <> 0");
    expect(sql).toContain("public.handle_new_user()");
    expect(sql).toContain("private.sync_community_social_counters()");
    expect(sql).toContain("public.tourist_points_v2");

    for (const functionName of RETIRED) {
      expect(sql).toContain(`DROP FUNCTION public.${functionName}();`);
    }
  });

  it("rejects future recreation of the retired trigger helpers", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      for (const functionName of RETIRED) {
        const recreates = new RegExp(
          String.raw`CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?${functionName}\s*\(`,
          "i",
        );
        if (recreates.test(sql)) offenders.push(`${name}: ${functionName}`);
      }
    }

    expect(
      offenders,
      "retired orphan trigger helpers must not return without a new explicit architecture decision",
    ).toEqual([]);
  });
});
