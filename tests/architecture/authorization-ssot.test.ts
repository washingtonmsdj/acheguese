import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const migrationsRoot = resolve(root, "supabase/migrations");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const roleHistoryBaseline =
  "20260830061455_lock_role_history_to_trigger_writer.sql";

function listRuntimeSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return listRuntimeSourceFiles(path);
    if (!/\.(ts|tsx)$/.test(entry) || /\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      return [];
    }
    return [path];
  });
}

describe("Authorization SSOT", () => {
  it("keeps global role decisions behind RoleService and role-rpc", () => {
    const roleService = read("src/core/authorization/services/RoleService.ts");
    const roleRpc = read("src/core/authorization/services/RoleRpcService.ts");
    const facade = read("src/core/authorization/index.ts");

    expect(roleService).toContain("RoleRpcService.hasRole");
    expect(roleService).toContain("RoleRpcService.getUserRoles");
    expect(roleService).toContain("RoleRpcService.isAdmin");
    expect(roleService).toContain("RoleRpcService.isSuperAdmin");
    expect(roleService).not.toContain("@/integrations/supabase");
    expect(roleService).not.toMatch(/\.from\(["']user_roles["']\)/);
    expect(roleRpc).toContain('const FUNCTION_NAME = "role-rpc"');
    expect(roleRpc).toContain("invokeSupabaseBroker");
    expect(facade).toContain('export { RoleService } from "./services/RoleService"');
  });

  it("keeps browser user_roles access read-only and mutations behind admin-role-rpc", () => {
    const directAccess = /\.from(?:<[^>]+>)?\(["']user_roles["']\)/;
    const directMutation = /\.from(?:<[^>]+>)?\(["']user_roles["']\)[\s\S]{0,220}?\.(?:insert|update|upsert|delete)\s*\(/;
    const sourceFiles = listRuntimeSourceFiles(srcRoot);

    const readers = sourceFiles
      .filter((path) => directAccess.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path).replace(/\\/g, "/"));
    const writers = sourceFiles
      .filter((path) => directMutation.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path).replace(/\\/g, "/"));

    expect(readers).toEqual(["src/core/admin/services/AdminRolesService.ts"]);
    expect(writers, "global role writes must never bypass the AAL2 admin broker").toEqual([]);

    const adminRoles = read("src/core/admin/services/AdminRolesService.ts");
    expect(adminRoles).not.toContain("async hasRole(");
    expect(adminRoles).not.toContain("async getUserRoles(");
    expect(adminRoles).toContain('functionName: "admin-role-rpc"');
    expect(adminRoles).toContain("async grantRole(");
    expect(adminRoles).toContain("async revokeRole(");
    expect(adminRoles).toContain("async renewRole(");
    expect(adminRoles).not.toContain("return false;");
  });

  it("keeps role_history read-only in browser and trigger-written", () => {
    const adminRoles = read("src/core/admin/services/AdminRolesService.ts");
    const migration = read(`supabase/migrations/${roleHistoryBaseline}`);

    expect(adminRoles).toContain('.from<RoleHistoryRow>("role_history")');
    expect(adminRoles).not.toMatch(
      /\.from(?:<[^>]+>)?\(["']role_history["']\)\s*\.(?:insert|update|upsert|delete)\s*\(/,
    );

    expect(migration).toContain("log_role_change_trigger");
    expect(migration).toContain("p.prosecdef");
    expect(migration).toContain("pg_get_userbyid(p.proowner)='postgres'");
    expect(migration).toContain("INSERT INTO role_history");
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Sistema pode inserir no histórico" ON public.role_history',
    );
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.role_history TO authenticated",
    );
    expect(migration).toContain(
      "GRANT ALL PRIVILEGES ON TABLE public.role_history TO service_role",
    );
  });

  it("rejects future browser writers on role_history", () => {
    const offenders = readdirSync(migrationsRoot)
      .filter((name) => name.endsWith(".sql") && name > roleHistoryBaseline)
      .sort()
      .filter((name) => {
        const sql = readFileSync(join(migrationsRoot, name), "utf8");
        const tableGrant =
          /GRANT\s+(?:ALL(?:\s+PRIVILEGES)?|[^;]*\b(?:INSERT|UPDATE|DELETE)\b[^;]*)\s+ON\s+(?:TABLE\s+)?public\.role_history\s+TO\s+[^;]*(?:\bPUBLIC\b|\banon\b|\bauthenticated\b)/i;
        const insertPolicy =
          /CREATE\s+POLICY[^;]*ON\s+public\.role_history[^;]*FOR\s+INSERT[^;]*TO\s+[^;]*\bauthenticated\b/i;
        return tableGrant.test(sql) || insertPolicy.test(sql);
      });

    expect(
      offenders,
      "role_history must remain browser-read-only and trigger/server-written",
    ).toEqual([]);
  });

  it("routes Admin composition reads through RoleService", () => {
    const adminData = read("src/core/admin/services/AdminDataService.ts");

    expect(adminData).toContain("RoleService.getUserRoles");
    expect(adminData).not.toContain("adminRolesService.getUserRoles");
  });

  it("keeps browser role RPCs behind the broker instead of direct helpers", () => {
    const forbidden = /\.rpc(?:<[^>]+>)?\(\s*["'](?:is_admin|is_super_admin|has_role|get_user_roles)["']/;
    const violations = listRuntimeSourceFiles(srcRoot)
      .filter((path) => forbidden.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path).replace(/\\/g, "/"));

    expect(violations).toEqual([]);
  });

  it("keeps Edge admin auth on the same aggregate role and MFA contract", () => {
    const adminAuth = read("supabase/functions/_shared/adminAuth.ts");
    const mfaPolicy = read("supabase/functions/_shared/mfaPolicy.ts");

    expect(adminAuth).toContain(".rpc('get_user_roles'");
    expect(adminAuth).not.toMatch(/\.from\(["']user_roles["']\)/);
    expect(adminAuth).toContain("roles.includes('super_admin')");
    expect(adminAuth).toContain("roles.includes('admin')");
    expect(adminAuth).toContain("evaluateUserMfaPolicy(supabase, user.id, token)");
    expect(adminAuth).toContain("if (mfaPolicy.required)");
    expect(mfaPolicy).toContain("auth.admin.mfa.listFactors");
    expect(mfaPolicy).toContain("getAuthenticatorAssuranceLevel(token)");
    expect(mfaPolicy).toContain('currentLevel !== "aal2"');
  });

  it("repairs aggregate validity and consolidates RLS helpers", () => {
    const roleRepair = read(
      "supabase/migrations/20260829202444_repair_get_user_roles_validity.sql",
    );
    const helperMigration = read(
      "supabase/migrations/20260829203016_consolidate_global_authorization_helpers.sql",
    );
    const lifecycle = read(
      "supabase/migrations/20260829203227_harden_user_role_lifecycle_grants.sql",
    );

    for (const predicate of [
      "ur.is_active = TRUE",
      "ur.revoked_at IS NULL",
      "ur.expires_at IS NULL",
      "ur.expires_at > now()",
    ]) {
      expect(roleRepair).toContain(predicate);
      expect(helperMigration).toContain(predicate);
    }

    expect(helperMigration).toContain("private.has_valid_global_role");
    expect(helperMigration).toContain("SELECT private.auth_can_access_profile");
    expect(helperMigration).toContain("SELECT private.group_can_manage_members");
    expect(helperMigration).toContain("global authorization policies still query user_roles directly");
    expect(lifecycle).toContain(
      "REVOKE DELETE ON TABLE public.user_roles FROM authenticated",
    );
  });
});