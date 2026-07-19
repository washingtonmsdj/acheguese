import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("private alpha access boundary", () => {
  const accessMigration = readProjectFile(
    "supabase/migrations/20260718210000_enforce_private_alpha_access.sql",
  );
  const enforcementMigration = readProjectFile(
    "supabase/migrations/20260718211000_require_alpha_invite_for_all_auth_identities.sql",
  );

  it("blocks Auth identity creation before public profile triggers run", () => {
    expect(accessMigration).toContain("BEFORE INSERT ON auth.users");
    expect(enforcementMigration).toContain("private_alpha_invite_required");
    expect(enforcementMigration).not.toMatch(
      /IF\s+COALESCE\(NEW\.raw_app_meta_data[\s\S]{0,120}private_alpha_access/,
    );
  });

  it("keeps invites private, expiring, limited and atomically consumed", () => {
    expect(accessMigration).toContain("private.alpha_access_invites");
    expect(accessMigration).toContain("FORCE ROW LEVEL SECURITY");
    expect(enforcementMigration).toContain("use_count = use_count + 1");
    expect(enforcementMigration).toContain("expires_at > now()");
    expect(enforcementMigration).toContain("use_count < max_uses");
    expect(enforcementMigration).toContain("alpha_access_audit_log");
    expect(accessMigration).toContain(
      "REVOKE ALL ON TABLE private.alpha_access_invites FROM PUBLIC, anon, authenticated",
    );
  });

  it("exposes invite management only to service_role", () => {
    expect(accessMigration).toContain(
      "auth.role() IS DISTINCT FROM 'service_role'",
    );
    expect(accessMigration).toMatch(
      /REVOKE ALL ON FUNCTION public\.alpha_access_issue_invite[\s\S]+FROM PUBLIC, anon, authenticated/,
    );
    expect(accessMigration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.alpha_access_issue_invite[\s\S]+TO service_role/,
    );
  });

  it("requires service-created operational users to consume an invite", () => {
    const fixture = readProjectFile(
      "tests/helpers/operational-auth-fixture.ts",
    );
    expect(fixture).toContain('admin.rpc("alpha_access_issue_invite"');
    expect(fixture).not.toContain("app_metadata:");
  });

  it("allows cleanup only for explicitly labelled synthetic invites", () => {
    const cleanupMigration = readProjectFile(
      "supabase/migrations/20260718212000_add_alpha_operational_invite_cleanup.sql",
    );

    expect(cleanupMigration).toContain(
      "invite.note IN ('operational_test', 'security_probe', 'e2e_seed')",
    );
    expect(cleanupMigration).toContain(
      "auth.role() IS DISTINCT FROM 'service_role'",
    );
    expect(cleanupMigration).toMatch(
      /REVOKE ALL ON FUNCTION public\.alpha_access_delete_operational_invite[\s\S]+FROM PUBLIC, anon, authenticated/,
    );
  });
});
