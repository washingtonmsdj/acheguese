import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260819090920_drop_legacy_ride_request_share_token.sql",
);

describe("canonical ride share token model", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("drops only the unused legacy ride_requests bearer column", () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.ride_requests\s+drop\s+column\s+share_token/i,
    );
    expect(sql).toContain("ride_requests.share_token still has % populated rows; migrate before drop");
    expect(sql).toContain("ride_requests.share_token has % unexpected dependencies");
  });

  it("requires the canonical ride_shares token model to remain present", () => {
    expect(sql).toContain("to_regclass('public.ride_shares')");
    expect(sql).toContain("table_name='ride_shares'");
    expect(sql).toContain("column_name='share_token'");
  });

  it("does not remove share_view_count or the canonical ride_shares token", () => {
    expect(sql).not.toMatch(/drop\s+column\s+share_view_count/i);
    expect(sql).not.toMatch(/alter\s+table\s+public\.ride_shares\s+drop\s+column/i);
  });
});
