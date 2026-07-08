import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("rls authorization helpers security", () => {
  it("moves RLS helper execution to the private schema", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260708000031_move_rls_authorization_helpers_to_private_schema.sql",
    );

    for (const helper of [
      "is_admin_from_roles",
      "is_admin",
      "is_admin_user",
      "is_super_admin",
      "can_manage_profile",
      "auth_can_access_profile",
    ]) {
      expect(migration).toContain(`CREATE OR REPLACE FUNCTION private.${helper}`);
      expect(migration).toContain(`public.${helper}`);
    }

    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.group_can_manage_members",
    );
    expect(migration).toContain("ALTER POLICY %I ON %I.%I");
    expect(migration).toContain("private.auth_can_access_profile(");
    expect(migration).toContain("private.can_manage_profile(");
    expect(migration).toContain("private.group_can_manage_members(");
    expect(migration).toContain("private.is_admin_from_roles(");
    expect(migration).toContain("private.is_admin_user(");
    expect(migration).toContain("private.is_super_admin(");
    expect(migration).toContain("private.is_admin(");
  });

  it("keeps public wrappers service-role-only", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260708000031_move_rls_authorization_helpers_to_private_schema.sql",
    );

    for (const signature of [
      "public.auth_can_access_profile(UUID)",
      "public.can_manage_profile(UUID)",
      "public.group_can_manage_members(UUID, UUID)",
      "public.is_admin(UUID)",
      "public.is_admin_from_roles(UUID)",
      "public.is_admin_user(UUID)",
      "public.is_super_admin(UUID)",
    ]) {
      expect(migration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC, anon, authenticated`,
      );
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO service_role`);
    }
  });

  it("routes browser admin checks through role-rpc", () => {
    const roleService = readProjectFile("src/core/authorization/services/RoleService.ts");
    const roleBroker = readProjectFile("src/core/authorization/services/RoleRpcService.ts");
    const edgeFunction = readProjectFile("supabase/functions/role-rpc/index.ts");

    expect(roleService).toContain("RoleRpcService.isAdmin");
    expect(roleService).toContain("RoleRpcService.isSuperAdmin");
    expect(roleService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']is_admin/);
    expect(roleService).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']is_super_admin/);
    expect(roleBroker).toContain('"isAdmin"');
    expect(roleBroker).toContain('"isSuperAdmin"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("is_admin"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("is_super_admin"');
  });
});
