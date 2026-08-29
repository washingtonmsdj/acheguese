import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const srcRoot = resolve(root, "src");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

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

  it("keeps direct user_roles persistence inside Admin management only", () => {
    const access = /\.from(?:<[^>]+>)?\(["']user_roles["']\)/;
    const callers = listRuntimeSourceFiles(srcRoot)
      .filter((path) => access.test(readFileSync(path, "utf8")))
      .map((path) => relative(root, path).replace(/\\/g, "/"));

    expect(callers).toEqual(["src/core/admin/services/AdminRolesService.ts"]);

    const adminRoles = read("src/core/admin/services/AdminRolesService.ts");
    expect(adminRoles).not.toContain("async hasRole(");
    expect(adminRoles).not.toContain("async getUserRoles(");
    expect(adminRoles).toContain("async grantRole(");
    expect(adminRoles).toContain("async revokeRole(");
    expect(adminRoles).toContain("async renewRole(");
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

  it("keeps Edge admin auth on the same aggregate role contract", () => {
    const adminAuth = read("supabase/functions/_shared/adminAuth.ts");

    expect(adminAuth).toContain(".rpc('get_user_roles'");
    expect(adminAuth).not.toMatch(/\.from\(["']user_roles["']\)/);
    expect(adminAuth).toContain("roles.includes('super_admin')");
    expect(adminAuth).toContain("roles.includes('admin')");
  });

  it("repairs aggregate validity and consolidates RLS helpers", () => {
    const roleRepair = read(
      "supabase/migrations/20260829203000_repair_get_user_roles_validity.sql",
    );
    const helperMigration = read(
      "supabase/migrations/20260829204000_consolidate_global_authorization_helpers.sql",
    );
    const lifecycle = read(
      "supabase/migrations/20260829204500_harden_user_role_lifecycle_grants.sql",
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
