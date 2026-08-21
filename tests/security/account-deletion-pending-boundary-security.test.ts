import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20260821022500_enforce_account_deletion_operational_boundary.sql",
  ),
  "utf8",
);
const privacyRpc = readFileSync(
  join(root, "supabase/functions/privacy-rpc/index.ts"),
  "utf8",
);
const privacyRpcService = readFileSync(
  join(root, "src/core/privacy/services/PrivacyRpcService.ts"),
  "utf8",
);
const privacySettingsService = readFileSync(
  join(root, "src/core/privacy/services/PrivacySettingsService.ts"),
  "utf8",
);
const privacyService = readFileSync(
  join(root, "src/core/privacy/services/PrivacyService.ts"),
  "utf8",
);
const protectedRoute = readFileSync(
  join(root, "src/core/routing/components/ProtectedRoute.tsx"),
  "utf8",
);

describe("LGPD pending deletion operational boundary", () => {
  it("depends fail-closed on the reversible deletion authority foundation", () => {
    expect(migration).toContain(
      "IF to_regclass('public.account_deletion_requests') IS NULL THEN",
    );
    expect(migration).toContain(
      "'public.request_account_deletion_for_user(uuid,text,boolean)'",
    );
    expect(migration).toContain(
      "'public.cancel_account_deletion_for_user(uuid,text)'",
    );
    expect(migration).toContain(
      "private.auth_account_operational already exists out-of-band",
    );
    expect(migration).toContain(
      "get_account_deletion_status_for_user already exists out-of-band",
    );
  });

  it("blocks pending accounts through the central profile authorization choke points", () => {
    expect(migration).toContain(
      "CREATE FUNCTION private.auth_account_operational()",
    );
    expect(migration).toContain(
      "request.status IN ('scheduled', 'processing', 'failed', 'completed')",
    );

    for (const signature of [
      "private.current_active_profile_id()",
      "private.auth_owns_usable_profile(p_profile_id UUID)",
      "private.auth_can_access_profile(p_profile_id UUID)",
      "private.can_manage_profile(p_profile_id UUID)",
      "private.auth_participates_community_direct_thread(p_thread_id UUID)",
    ]) {
      expect(migration).toContain(signature);
    }

    expect(
      migration.match(/private\.auth_account_operational\(\)/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(10);
  });

  it("keeps the account-level helper and deletion authority off browser roles", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.auth_account_operational() FROM authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.get_account_deletion_status_for_user(UUID) FROM authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) FROM authenticated",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_account_deletion_status_for_user(UUID) TO service_role",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role",
    );
  });

  it("preserves scheduled retries and checks product obligations only for new or restarted requests", () => {
    expect(migration).toContain("v_request_exists BOOLEAN := FALSE");
    expect(migration).toContain("v_request_exists := FOUND");
    expect(migration).toContain(
      "IF v_request_exists AND v_request.status = 'scheduled' THEN",
    );
    expect(migration).toContain("ACCOUNT_DELETION_ADMIN_REQUIRES_DPO");
    expect(migration).toContain("ACCOUNT_DELETION_ACTIVE_BUSINESS");
    expect(migration).toContain("ACCOUNT_DELETION_ACTIVE_RIDE");
    expect(migration).toContain("ACCOUNT_DELETION_ACTIVE_ORDER");
    expect(migration).toContain(
      "business.status IN ('active', 'pending', 'suspended')",
    );
    expect(migration).toContain(
      "order_row.logistics_status NOT IN ('delivered', 'canceled', 'failed')",
    );
  });

  it("routes deletion status, request and cancellation through privacy-rpc", () => {
    expect(privacyRpc).toContain("getDeletionStatus: true");
    expect(privacyRpc).toContain("requestAccountDeletion: true");
    expect(privacyRpc).toContain("cancelAccountDeletion: true");
    expect(privacyRpc).toContain(
      '"get_account_deletion_status_for_user"',
    );
    expect(privacyRpc).toContain('"request_account_deletion_for_user"');
    expect(privacyRpc).toContain('"cancel_account_deletion_for_user"');
    expect(privacyRpc).not.toContain("auth.admin.updateUserById");
  });

  it("removes stale deletion-table and destructive-handler authority from browser services", () => {
    expect(privacySettingsService).not.toContain("user_deletion_schedule");
    expect(privacySettingsService).not.toContain(
      'buildSupabaseFunctionUrl("user-delete-account")',
    );
    expect(privacyService).not.toContain(
      'supabase.functions.invoke("user-delete-account"',
    );
    expect(privacyRpcService).toContain('"getDeletionStatus"');
    expect(privacyRpcService).toContain('"requestAccountDeletion"');
  });

  it("keeps restricted accounts on the privacy route without blocking cancellation", () => {
    expect(protectedRoute).toContain(
      'const PRIVACY_ACCOUNT_PATH = "/conta/privacidade"',
    );
    expect(protectedRoute).toContain('"scheduled"');
    expect(protectedRoute).toContain('"processing"');
    expect(protectedRoute).toContain('"failed"');
    expect(protectedRoute).toContain('"completed"');
    expect(protectedRoute).toContain(
      "location.pathname !== PRIVACY_ACCOUNT_PATH",
    );
    expect(protectedRoute).toContain(
      '["deletion-status", user?.id]',
    );
  });

  it("does not add destructive purge operations to the pending boundary", () => {
    expect(migration).not.toContain("DELETE FROM auth.users");
    expect(migration).not.toContain("DROP TABLE public.account_deletion_requests");
    expect(privacyRpc).not.toContain("auth.admin.deleteUser");
  });
});
