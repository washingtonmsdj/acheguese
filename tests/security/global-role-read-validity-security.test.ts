import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const REPAIR_MIGRATION =
  "supabase/migrations/20260829202444_repair_get_user_roles_validity.sql";

describe("G4 aggregate role-read validity", () => {
  it("keeps get_user_roles aligned with the canonical role validity predicate", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, REPAIR_MIGRATION),
      "utf8",
    );
    const canonical = fs.readFileSync(
      path.join(
        ROOT,
        "supabase/migrations/20260820000837_harden_admin_role_validity.sql",
      ),
      "utf8",
    );

    for (const predicate of [
      "ur.is_active = TRUE",
      "ur.revoked_at IS NULL",
      "ur.expires_at IS NULL",
      "ur.expires_at > now()",
    ]) {
      expect(migration).toContain(predicate);
      expect(canonical).toContain(predicate);
    }
  });

  it("keeps aggregate role reads behind role-rpc", () => {
    const migration = fs.readFileSync(
      path.join(ROOT, REPAIR_MIGRATION),
      "utf8",
    );
    const edgeFunction = fs.readFileSync(
      path.join(ROOT, "supabase/functions/role-rpc/index.ts"),
      "utf8",
    );
    const client = fs.readFileSync(
      path.join(ROOT, "src/core/authorization/services/RoleRpcService.ts"),
      "utf8",
    );

    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.get_user_roles(UUID)",
    );
    expect(migration).toContain(
      "FROM PUBLIC, anon, authenticated, service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO service_role;",
    );
    expect(edgeFunction).toContain('supabaseAdmin.rpc("get_user_roles"');
    expect(edgeFunction).toContain("requireAllowedTarget(auth, targetUserId)");
    expect(client).toContain('const FUNCTION_NAME = "role-rpc"');
    expect(client).toContain("invokeSupabaseBroker");
  });

  it("keeps role-rpc cross-user authorization on the canonical admin predicate", () => {
    const edgeFunction = fs.readFileSync(
      path.join(ROOT, "supabase/functions/role-rpc/index.ts"),
      "utf8",
    );

    expect(edgeFunction).toContain('supabaseAdmin.rpc("is_admin"');
    expect(edgeFunction).toContain("p_user_id: userId");
    expect(edgeFunction).not.toContain('.from("user_roles")');
  });

  it("keeps shared Edge admin auth on get_user_roles instead of duplicating validity", () => {
    const adminAuth = fs.readFileSync(
      path.join(ROOT, "supabase/functions/_shared/adminAuth.ts"),
      "utf8",
    );

    expect(adminAuth).toContain(".rpc('get_user_roles'");
    expect(adminAuth).not.toMatch(/\.from\(["']user_roles["']\)/);
  });
});
