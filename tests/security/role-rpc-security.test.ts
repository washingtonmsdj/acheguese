import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("role rpc broker security", () => {
  it("routes role read helpers through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/role-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/authorization/services/RoleRpcService.ts");
    const roleService = readProjectFile("src/core/authorization/services/RoleService.ts");

    expect(config).toContain("[functions.role-rpc]");
    expect(config).toMatch(/\[functions\.role-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain("requireAllowedTarget");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("has_role"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("get_user_roles"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("is_admin"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("is_super_admin"');
    expect(edgeFunction).not.toContain('.from("user_roles")');

    expect(broker).toContain('const FUNCTION_NAME = "role-rpc"');
    expect(roleService).toContain("RoleRpcService.hasRole");
    expect(roleService).toContain("RoleRpcService.getUserRoles");
    expect(roleService).toContain("RoleRpcService.isAdmin");
    expect(roleService).toContain("RoleRpcService.isSuperAdmin");
    expect(roleService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']has_role/);
    expect(roleService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']get_user_roles/);
    expect(roleService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']is_admin/);
    expect(roleService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']is_super_admin/);
  });

  it("revokes direct browser execution of backing role read helpers", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707234302_route_role_read_helpers_through_edge_function.sql",
    );

    for (const signature of [
      "public.has_role(uuid, public.app_role)",
      "public.get_user_roles(uuid)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }
  });
});
