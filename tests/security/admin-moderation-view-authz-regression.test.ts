import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260825185039_gate_admin_moderation_views.sql",
);

function normalizedMigration(): string {
  return readFileSync(MIGRATION, "utf8")
    .replace(/--[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ADMIN_VIEWS = [
  "admin_pending_post_reports",
  "admin_pending_comment_reports",
] as const;

describe("admin moderation view authorization regression guard", () => {
  it("keeps moderation queue views security-invoker and canonically admin-gated", () => {
    const sql = normalizedMigration();

    for (const view of ADMIN_VIEWS) {
      expect(sql).toMatch(
        new RegExp(
          `create\\s+or\\s+replace\\s+view\\s+public\\.${view}\\s+with\\s*\\(\\s*security_invoker\\s*=\\s*true\\s*\\)`,
          "i",
        ),
      );
    }

    const adminGateMatches = sql.match(
      /coalesce\s*\(\s*private\.is_admin_user\s*\(\s*\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)\s*\)\s*,\s*false\s*\)/gi,
    );
    expect(adminGateMatches?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("keeps anonymous SELECT revoked while authenticated admins can query the views", () => {
    const sql = normalizedMigration();

    for (const view of ADMIN_VIEWS) {
      expect(sql).toMatch(
        new RegExp(
          `revoke\\s+select\\s+on\\s+public\\.${view}\\s+from\\s+anon`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `grant\\s+select\\s+on\\s+public\\.${view}\\s+to\\s+authenticated`,
          "i",
        ),
      );
    }
  });
});
