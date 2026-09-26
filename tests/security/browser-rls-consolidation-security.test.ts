import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926012500_consolidate_browser_rls_policies.sql",
  "utf8",
);

describe("browser RLS consolidation hardening", () => {
  it("removes anonymous table-level access to function_audit", () => {
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.function_audit FROM anon;",
    );
  });

  it("preserves owner-or-admin audit visibility for authenticated users", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Admins can view audit logs"',
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Users can view their own audit logs"',
    );
    expect(migration).toContain(
      'CREATE POLICY "Authenticated users view own or admin audit logs"',
    );
    expect(migration).toContain("TO authenticated");
    expect(migration).toContain("user_id = (SELECT auth.uid())");
    expect(migration).toContain("private.is_admin((SELECT auth.uid()))");
  });

  it("removes only shadow public-read policies", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Grupos territoriais ativos visíveis publicamente"',
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Tourist points public read"',
    );
    expect(migration).not.toContain(
      'DROP POLICY IF EXISTS "Territorial groups viewable by all"',
    );
    expect(migration).not.toContain(
      'DROP POLICY IF EXISTS "Published tourist points public read"',
    );
  });

  it("never disables RLS or grants new browser privileges", () => {
    expect(migration).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(migration).not.toMatch(/\bGRANT\b/i);
    expect(migration).not.toMatch(/\bTO\s+anon\b/i);
  });
});
