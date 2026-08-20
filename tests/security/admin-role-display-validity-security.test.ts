import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const edgeFunction = readFileSync(
  resolve(root, "supabase/functions/admin-get-user/index.ts"),
  "utf8",
);

const migrationName = readdirSync(resolve(root, "supabase/migrations")).find(
  (name) => name.endsWith("_filter_admin_role_display_validity.sql"),
);

if (!migrationName) {
  throw new Error("admin role display validity migration not found");
}

const migration = readFileSync(
  resolve(root, "supabase/migrations", migrationName),
  "utf8",
);

describe("admin role display validity", () => {
  it("aligns admin-get-user role display with active and unrevoked assignments", () => {
    expect(edgeFunction).toContain(".select('role_enum, expires_at')");
    expect(edgeFunction).toContain(".eq('is_active', true)");
    expect(edgeFunction).toContain(".is('revoked_at', null)");
  });

  it("fails closed on expired or malformed role expirations in admin-get-user", () => {
    expect(edgeFunction).toContain("function hasCurrentRoleValidity");
    expect(edgeFunction).toContain("Date.parse(role.expires_at)");
    expect(edgeFunction).toContain("Number.isFinite(expiresAtMs) && expiresAtMs > nowMs");
    expect(edgeFunction).toContain(".filter((role) => hasCurrentRoleValidity(role, nowMs))");
  });

  it("aligns admin-list-users role aggregation with the same validity contract", () => {
    expect(migration).toContain("role_record.is_active IS TRUE");
    expect(migration).toContain("role_record.revoked_at IS NULL");
    expect(migration).toContain("role_record.expires_at IS NULL");
    expect(migration).toContain("role_record.expires_at > now()");
  });

  it("preserves the privileged RPC boundary", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("auth.role() IS DISTINCT FROM 'service_role'");
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.admin_list_user_account_contexts\([\s\S]*FROM PUBLIC, anon, authenticated;/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.admin_list_user_account_contexts\([\s\S]*TO service_role;/,
    );
  });

  it("does not mutate user_roles data", () => {
    expect(migration).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|TRUNCATE)\s+(?:TABLE\s+)?(?:public\.)?user_roles\b/i);
  });

  it("keeps explicit postconditions for all three validity dimensions", () => {
    expect(migration).toContain("postcondition failed: admin list RPC does not require active roles");
    expect(migration).toContain("postcondition failed: admin list RPC does not reject revoked roles");
    expect(migration).toContain("postcondition failed: admin list RPC does not reject expired roles");
  });
});
