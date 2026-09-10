import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const adminRolesService = read("src/core/admin/services/AdminRolesService.ts");
const adminUserService = read("src/core/admin/services/AdminUserService.ts");
const adminDataService = read("src/core/admin/services/AdminDataService.ts");
const adminRolesPage = read("src/modules/admin/pages/AdminRoles.tsx");
const broker = read("supabase/functions/admin-role-rpc/index.ts");
const config = read("supabase/config.toml");
const pendingCutover = read(
  "docs/09-reference/migrations-pending/20260910211500_lock_user_role_writes_to_admin_broker_g42.sql",
);

describe("admin global-role authority G42", () => {
  it("routes every browser role mutation through the dedicated admin broker", () => {
    expect(adminRolesService).toContain('functionName: "admin-role-rpc"');
    expect(adminRolesService).toContain("invokeSupabaseBroker");
    expect(adminRolesService).not.toContain(".insert(");
    expect(adminRolesService).not.toContain(".update(");
    expect(adminRolesService).not.toContain("grantedBy");
    expect(adminRolesService).not.toContain("revokedBy");
    expect(adminRolesService).not.toContain("renewedBy");

    expect(adminUserService).not.toContain("grantedBy");
    expect(adminDataService).not.toContain("grantedBy");
    expect(adminRolesPage).not.toContain("revokedBy");
    expect(adminRolesPage).not.toContain("renewedBy");
  });

  it("derives the privileged actor from a super-admin AAL2 session", () => {
    expect(broker).toContain('import { requireSuperAdmin } from "../_shared/adminAuth.ts"');
    expect(broker).toContain("const auth = await requireSuperAdmin(req)");
    expect(broker).toContain("granted_by: actorUserId");
    expect(broker).toContain("revoked_by: actorUserId");
    expect(broker).not.toContain("params.grantedBy");
    expect(broker).not.toContain("params.revokedBy");
    expect(broker).not.toContain("params.renewedBy");
  });

  it("validates targets and requires correlated mutation acknowledgements", () => {
    expect(broker).toContain("ensureTargetUserExists");
    expect(broker).toContain("requireAppRole");
    expect(broker).toContain("requiredFutureTimestamp");
    expect(broker).toContain("Role grant returned an invalid acknowledgement");
    expect(broker).toContain("Role revocation returned an invalid acknowledgement");
    expect(broker).toContain("Role renewal returned an invalid acknowledgement");
    expect(adminRolesService).toContain("Invalid admin role mutation acknowledgement");
  });

  it("registers JWT enforcement and stages the direct-Data-API write cutover", () => {
    expect(config).toMatch(/\[functions\.admin-role-rpc\]\s+verify_jwt = true/);
    expect(pendingCutover).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles",
    );
    expect(pendingCutover).toContain("FROM PUBLIC, anon, authenticated");
    expect(pendingCutover).toContain(
      'DROP POLICY IF EXISTS "Super admins podem gerenciar roles"',
    );
    expect(pendingCutover).toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO service_role",
    );
  });
});
