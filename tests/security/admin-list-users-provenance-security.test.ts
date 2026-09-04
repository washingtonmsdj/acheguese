import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const edgeFunction = readFileSync(
  resolve(root, "supabase/functions/admin-list-users/index.ts"),
  "utf8",
);
const accountListMigration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260719010000_list_admin_user_accounts.sql",
  ),
  "utf8",
);
const adminAuth = readFileSync(
  resolve(root, "supabase/functions/_shared/adminAuth.ts"),
  "utf8",
);

describe("admin-list-users runtime provenance", () => {
  it("keeps account-level pagination in the privileged database RPC", () => {
    expect(edgeFunction).toContain('"admin_list_user_account_contexts"');
    expect(edgeFunction).toContain("p_page: page");
    expect(edgeFunction).toContain("p_page_size: pageSize");
    expect(edgeFunction).toContain("p_search: normalizedSearch");
    expect(edgeFunction).not.toMatch(/\.from\(["']profiles["']\)/);
  });

  it("keeps the RPC service-role-only and fail-closed", () => {
    expect(accountListMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.admin_list_user_account_contexts",
    );
    expect(accountListMigration).toContain("SECURITY DEFINER");
    expect(accountListMigration).toContain("SET search_path = ''");
    expect(accountListMigration).toContain(
      "IF auth.role() IS DISTINCT FROM 'service_role' THEN",
    );
    expect(accountListMigration).toMatch(
      /REVOKE ALL ON FUNCTION public\.admin_list_user_account_contexts\([\s\S]*FROM PUBLIC, anon, authenticated;/,
    );
    expect(accountListMigration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.admin_list_user_account_contexts\([\s\S]*TO service_role;/,
    );
  });

  it("keeps account search and pagination authoritative in the database", () => {
    expect(accountListMigration).toContain("FROM auth.users AS account");
    expect(accountListMigration).toContain("LIMIT p_page_size");
    expect(accountListMigration).toContain("OFFSET p_page * p_page_size");
    expect(accountListMigration).toContain("lower(COALESCE(account.email, ''))");
  });

  it("combines the recovered entrypoint with canonical aggregate role validity", () => {
    expect(edgeFunction).toContain("await requireAdmin(req)");
    expect(adminAuth).toContain("supabase.rpc('get_user_roles'");
    expect(adminAuth).toContain("_user_id: user.id");
    expect(adminAuth).toContain("const adminRole = resolveAdminRole(roles)");
    expect(adminAuth).not.toContain(".from('user_roles')");
  });

  it("does not expose raw backend errors to clients", () => {
    expect(edgeFunction).toContain("getErrorDiagnostic(error)");
    expect(edgeFunction).toContain(
      'JSON.stringify({ error: "Internal server error" })',
    );
    expect(edgeFunction).not.toContain("details: { error: message }");
  });
});
