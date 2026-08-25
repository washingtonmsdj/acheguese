import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const operationalMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260821022500_enforce_account_deletion_operational_boundary.sql",
  ),
  "utf8",
);
const dmlGuardMigration = readFileSync(
  join(
    root,
    "supabase/migrations/20260821024000_guard_pending_deletion_dml.sql",
  ),
  "utf8",
);
const privacyRpc = readFileSync(
  join(root, "supabase/functions/privacy-rpc/index.ts"),
  "utf8",
);

describe("LGPD pending deletion backend boundary", () => {
  it("depends fail-closed on the reversible deletion authority foundation", () => {
    expect(operationalMigration).toContain(
      "IF to_regclass('public.account_deletion_requests') IS NULL THEN",
    );
    expect(operationalMigration).toContain(
      "'public.request_account_deletion_for_user(uuid,text,boolean)'",
    );
    expect(operationalMigration).toContain(
      "'public.cancel_account_deletion_for_user(uuid,text)'",
    );
    expect(operationalMigration).toContain(
      "private.auth_account_operational already exists out-of-band",
    );
    expect(dmlGuardMigration).toContain(
      "IF to_regprocedure('private.auth_account_operational()') IS NULL THEN",
    );
  });

  it("uses the effective request role instead of auth.role inside SECURITY DEFINER boundaries", () => {
    expect(operationalMigration).toContain(
      "current_setting('role', true)",
    );
    expect(dmlGuardMigration).toContain(
      "current_setting('role', true)",
    );
    expect(operationalMigration).not.toMatch(
      /COALESCE\(auth\.role\(\)/,
    );
    expect(dmlGuardMigration).not.toMatch(
      /COALESCE\(auth\.role\(\)/,
    );
  });

  it("wires pending-account state into the existing profile authorization choke points", () => {
    expect(operationalMigration).toContain(
      "CREATE FUNCTION private.auth_account_operational()",
    );
    expect(operationalMigration).toContain(
      "request.status IN ('scheduled', 'processing', 'failed', 'completed')",
    );

    for (const signature of [
      "private.current_active_profile_id()",
      "private.auth_owns_usable_profile(p_profile_id UUID)",
      "private.auth_can_access_profile(p_profile_id UUID)",
      "private.can_manage_profile(p_profile_id UUID)",
      "private.auth_participates_community_direct_thread(p_thread_id UUID)",
    ]) {
      expect(operationalMigration).toContain(signature);
    }

    expect(
      operationalMigration.match(
        /private\.auth_account_operational\(\)/g,
      )?.length ?? 0,
    ).toBeGreaterThanOrEqual(10);
  });

  it("keeps deletion authority and guard internals off browser roles", () => {
    expect(operationalMigration).toContain(
      "REVOKE ALL ON FUNCTION private.auth_account_operational() FROM authenticated",
    );
    expect(operationalMigration).toContain(
      "REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM authenticated",
    );
    expect(operationalMigration).toContain(
      "REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM authenticated",
    );
    expect(operationalMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_account_deletion_status_for_user(UUID) TO service_role",
    );
    expect(operationalMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role",
    );
    expect(dmlGuardMigration).toContain(
      "REVOKE ALL ON FUNCTION private.guard_pending_deletion_write() FROM authenticated",
    );
    expect(dmlGuardMigration).toContain(
      "REVOKE ALL ON FUNCTION private.ensure_pending_deletion_write_guards() FROM authenticated",
    );
  });

  it("preserves idempotent scheduled requests, failed retries, and product obligation blockers", () => {
    expect(operationalMigration).toContain(
      "IF v_request_exists AND v_request.status = 'scheduled' THEN",
    );
    expect(operationalMigration).toContain(
      "v_request.status IN ('processing', 'completed')",
    );
    expect(operationalMigration).toContain(
      "failure_code = NULL",
    );
    expect(operationalMigration).toContain(
      "ACCOUNT_DELETION_ADMIN_REQUIRES_DPO",
    );
    expect(operationalMigration).toContain(
      "ACCOUNT_DELETION_ACTIVE_BUSINESS",
    );
    expect(operationalMigration).toContain(
      "ACCOUNT_DELETION_ACTIVE_RIDE",
    );
    expect(operationalMigration).toContain(
      "ACCOUNT_DELETION_ACTIVE_ORDER",
    );
    expect(operationalMigration).toContain(
      "business.status IN ('active', 'pending', 'suspended')",
    );
    expect(operationalMigration).toContain(
      "order_row.logistics_status NOT IN ('delivered', 'canceled', 'failed')",
    );
  });

  it("adds a statement-level DML guard to application-owned public tables only", () => {
    expect(dmlGuardMigration).toContain(
      "CREATE FUNCTION private.guard_pending_deletion_write()",
    );
    expect(dmlGuardMigration).toContain(
      "ACCOUNT_PENDING_DELETION_READ_ONLY",
    );
    expect(dmlGuardMigration).toContain(
      "request.status IN ('scheduled', 'processing', 'failed', 'completed')",
    );
    expect(dmlGuardMigration).toContain(
      "c.relkind IN ('r', 'p')",
    );
    expect(dmlGuardMigration).toContain(
      "dependency.deptype = 'e'",
    );
    expect(dmlGuardMigration).toContain(
      "JOIN pg_extension extension_row",
    );
    expect(dmlGuardMigration).toContain(
      "BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT",
    );
    expect(dmlGuardMigration).toContain(
      "EXECUTE FUNCTION private.guard_pending_deletion_write()",
    );
  });

  it("verifies trigger coverage, shape, enabled state, and exact function binding", () => {
    expect(dmlGuardMigration).toContain(
      "pending deletion DML guard coverage mismatch",
    );
    expect(dmlGuardMigration).toContain(
      "(trigger_row.tgtype & 1) <> 0",
    );
    expect(dmlGuardMigration).toContain(
      "(trigger_row.tgtype & 2) = 0",
    );
    expect(dmlGuardMigration).toContain(
      "(trigger_row.tgtype & 4) = 0",
    );
    expect(dmlGuardMigration).toContain(
      "(trigger_row.tgtype & 8) = 0",
    );
    expect(dmlGuardMigration).toContain(
      "(trigger_row.tgtype & 16) = 0",
    );
    expect(dmlGuardMigration).toContain(
      "trigger_row.tgenabled <> 'O'",
    );
    expect(dmlGuardMigration).toContain(
      "trigger_row.tgfoid <> v_guard_oid",
    );
    expect(dmlGuardMigration).toContain(
      "pending deletion DML guard was attached to extension-owned relation",
    );
  });

  it("routes deletion authority through privacy-rpc and preserves legacy cancellation recovery", () => {
    expect(privacyRpc).toContain("getDeletionStatus: true");
    expect(privacyRpc).toContain("requestAccountDeletion: true");
    expect(privacyRpc).toContain("cancelAccountDeletion: true");
    expect(privacyRpc).toContain(
      '"get_account_deletion_status_for_user"',
    );
    expect(privacyRpc).toContain(
      '"request_account_deletion_for_user"',
    );
    expect(privacyRpc).toContain(
      '"cancel_account_deletion_for_user"',
    );
    expect(privacyRpc).toContain(
      "supabaseAdmin.auth.admin.getUserById",
    );
    expect(privacyRpc).toContain(
      "supabaseAdmin.auth.admin.updateUserById",
    );
    expect(privacyRpc).toContain(
      "delete userMetadata.account_status",
    );
    expect(privacyRpc).toContain(
      "delete userMetadata.scheduled_purge_at",
    );
  });

  it("accepts modern Supabase secret keys without exposing them to browser code", () => {
    expect(privacyRpc).toContain('"SUPABASE_SECRET_KEYS"');
    expect(privacyRpc).toContain('"SUPABASE_SECRET_KEY"');
    expect(privacyRpc).toContain('"SUPABASE_SERVICE_ROLE_KEY"');
    expect(privacyRpc).toContain(
      'getRequiredEnv("SUPABASE_URL")',
    );
    expect(privacyRpc).not.toContain("VITE_SUPABASE_SECRET");
  });

  it("does not introduce destructive purge operations", () => {
    expect(operationalMigration).not.toContain("DELETE FROM auth.users");
    expect(operationalMigration).not.toContain(
      "DROP TABLE public.account_deletion_requests",
    );
    expect(dmlGuardMigration).not.toContain("DELETE FROM auth.users");
    expect(dmlGuardMigration).not.toContain("DROP TABLE");
    expect(privacyRpc).not.toContain("auth.admin.deleteUser");
  });
});
