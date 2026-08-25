import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");
const migration = readFileSync(
  resolve(
    repoRoot,
    "supabase/migrations/20260825223100_remove_review_reports_profile_role_shadow.sql",
  ),
  "utf8",
);

describe("review report authority", () => {
  it("removes profile-local role escalation from global report reads", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Admins view all reports" ON public.review_reports',
    );
    expect(migration).toContain("review_reports_select_own_or_admin");
    expect(migration).not.toMatch(/CREATE\s+POLICY\s+"Admins view all reports"/i);
  });

  it("fails closed when the canonical own-or-admin policy is absent", () => {
    expect(migration).toContain("canonical review_reports_select_own_or_admin policy is missing");
    expect(migration).toMatch(/FROM\s+pg_policies/i);
    expect(migration).toContain("tablename = 'review_reports'");
  });
});
