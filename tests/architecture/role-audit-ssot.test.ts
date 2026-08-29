import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("G4 role audit SSOT", () => {
  it("keeps grant and revoke audit owned by the database trigger", () => {
    const service = fs.readFileSync(
      path.join(ROOT, "src/core/admin/services/AdminRolesService.ts"),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(
        ROOT,
        "supabase/migrations/20260418000001_migrate_user_roles_to_new_structure.sql",
      ),
      "utf8",
    );

    const grantStart = service.indexOf("async grantRole(");
    const revokeStart = service.indexOf("async revokeRole(");
    const historyStart = service.indexOf("async getUserRoleHistory(");

    expect(grantStart).toBeGreaterThanOrEqual(0);
    expect(revokeStart).toBeGreaterThan(grantStart);
    expect(historyStart).toBeGreaterThan(revokeStart);

    const grantSection = service.slice(grantStart, revokeStart);
    const revokeSection = service.slice(revokeStart, historyStart);

    expect(migration).toContain("CREATE TRIGGER log_role_change_trigger");
    expect(migration).toContain("AFTER INSERT OR UPDATE ON user_roles");
    expect(grantSection).not.toContain("logRoleHistory");
    expect(revokeSection).not.toContain("logRoleHistory");
    expect(revokeSection).toContain("reason: params.reason ?? null");
  });

  it("keeps renewal audit explicit because expiry updates do not trigger role-change audit", () => {
    const service = fs.readFileSync(
      path.join(ROOT, "src/core/admin/services/AdminRolesService.ts"),
      "utf8",
    );

    const renewStart = service.indexOf("async renewRole(");
    const logStart = service.indexOf("private async logRoleHistory(");
    expect(renewStart).toBeGreaterThanOrEqual(0);
    expect(logStart).toBeGreaterThan(renewStart);

    const renewSection = service.slice(renewStart, logStart);
    expect(renewSection).toContain("this.logRoleHistory");
    expect(renewSection).toContain('reason: "Role renewed"');
  });
});
