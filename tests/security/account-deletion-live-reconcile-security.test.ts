import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const reconcileMigration = readFileSync(
  join(
    root,
    'supabase/migrations/20260826015916_reconcile_account_deletion_authority_live_drift.sql',
  ),
  'utf8',
);
const privacyRpc = readFileSync(
  join(root, 'supabase/functions/privacy-rpc/index.ts'),
  'utf8',
);

describe('live account deletion authority reconciliation', () => {
  it('stays forward-only and does not overwrite newer profile authorization helpers', () => {
    expect(reconcileMigration).toContain('This forward-only migration installs');
    expect(reconcileMigration).toContain(
      'without redefining those newer helpers',
    );

    expect(reconcileMigration).not.toMatch(
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+private\.(?:current_active_profile_id|auth_owns_usable_profile|auth_can_access_profile|can_manage_profile|auth_participates_community_direct_thread)\b/i,
    );
  });

  it('fails closed if deletion authority already exists out of band', () => {
    expect(reconcileMigration).toContain(
      "IF to_regclass('public.account_deletion_requests') IS NOT NULL THEN",
    );
    expect(reconcileMigration).toContain(
      "'public.request_account_deletion_for_user(uuid,text,boolean)'",
    );
    expect(reconcileMigration).toContain(
      "'public.get_account_deletion_status_for_user(uuid)'",
    );
    expect(reconcileMigration).toContain(
      'account-deletion operational helpers already exist; reconcile migration requires review',
    );
  });

  it('keeps the request table default-deny for browser roles and broker-only for service role', () => {
    expect(reconcileMigration).toContain(
      'ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY',
    );
    expect(reconcileMigration).toContain(
      'REVOKE ALL ON TABLE public.account_deletion_requests FROM PUBLIC',
    );
    expect(reconcileMigration).toContain(
      'REVOKE ALL ON TABLE public.account_deletion_requests FROM anon',
    );
    expect(reconcileMigration).toContain(
      'REVOKE ALL ON TABLE public.account_deletion_requests FROM authenticated',
    );
    expect(reconcileMigration).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role',
    );
    expect(reconcileMigration).toContain(
      "RAISE EXCEPTION 'browser role has direct account_deletion_requests authority'",
    );
  });

  it('keeps status, request and cancellation authority off direct browser RPC access', () => {
    for (const signature of [
      'public.get_account_deletion_status_for_user(UUID)',
      'public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN)',
      'public.cancel_account_deletion_for_user(UUID, TEXT)',
    ]) {
      expect(reconcileMigration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC`,
      );
      expect(reconcileMigration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM anon`,
      );
      expect(reconcileMigration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM authenticated`,
      );
      expect(reconcileMigration).toContain(
        `GRANT EXECUTE ON FUNCTION ${signature} TO service_role`,
      );
    }

    expect(reconcileMigration).toContain(
      "RAISE EXCEPTION 'browser role can execute account-deletion authority directly'",
    );
  });

  it('preserves reversible grace-period semantics and operational blockers', () => {
    expect(reconcileMigration).toContain(
      "status IN ('scheduled', 'cancelled', 'processing', 'completed', 'failed')",
    );
    expect(reconcileMigration).toContain("v_now + INTERVAL '30 days'");
    expect(reconcileMigration).toContain(
      'export_requested = export_requested OR COALESCE(p_export_requested, FALSE)',
    );
    expect(reconcileMigration).toContain(
      'ACCOUNT_DELETION_ADMIN_REQUIRES_DPO',
    );
    expect(reconcileMigration).toContain('ACCOUNT_DELETION_ACTIVE_BUSINESS');
    expect(reconcileMigration).toContain('ACCOUNT_DELETION_ACTIVE_RIDE');
    expect(reconcileMigration).toContain('ACCOUNT_DELETION_ACTIVE_ORDER');
    expect(reconcileMigration).toContain("status = 'cancelled'");
  });

  it('enforces a fail-closed pending-deletion DML hold across application-owned public tables', () => {
    expect(reconcileMigration).toContain(
      'CREATE FUNCTION private.guard_pending_deletion_write()',
    );
    expect(reconcileMigration).toContain(
      "v_role TEXT := COALESCE(current_setting('role', true), '')",
    );
    expect(reconcileMigration).toContain('v_user_id UUID := auth.uid()');
    expect(reconcileMigration).toContain(
      "request.status IN ('scheduled', 'processing', 'failed', 'completed')",
    );
    expect(reconcileMigration).toContain(
      "RAISE EXCEPTION 'ACCOUNT_PENDING_DELETION_READ_ONLY'",
    );
    expect(reconcileMigration).toContain(
      'CREATE FUNCTION private.ensure_pending_deletion_write_guards()',
    );
    expect(reconcileMigration).toContain("c.relkind IN ('r', 'p')");
    expect(reconcileMigration).toContain('JOIN pg_extension extension_row');
    expect(reconcileMigration).toContain("dependency.deptype = 'e'");
    expect(reconcileMigration).toContain(
      'CREATE TRIGGER account_operational_write_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION private.guard_pending_deletion_write()',
    );
    expect(reconcileMigration).toContain(
      'pending deletion DML guard coverage mismatch: expected %, guarded %',
    );
  });

  it('keeps operational guard internals unavailable to browser roles', () => {
    for (const signature of [
      'private.auth_account_operational()',
      'private.guard_pending_deletion_write()',
      'private.ensure_pending_deletion_write_guards()',
    ]) {
      expect(reconcileMigration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC`,
      );
      expect(reconcileMigration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM anon`,
      );
      expect(reconcileMigration).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM authenticated`,
      );
    }
  });

  it('routes browser actions through the JWT-bound privacy broker', () => {
    for (const action of [
      'recordConsent',
      'getDeletionStatus',
      'requestAccountDeletion',
      'cancelAccountDeletion',
    ]) {
      expect(privacyRpc).toContain(`${action}: true`);
    }

    expect(privacyRpc).toContain('supabaseAdmin.auth.getUser(token)');
    expect(privacyRpc).toContain('return { userId: data.user.id }');
    expect(privacyRpc).toContain('"get_account_deletion_status_for_user"');
    expect(privacyRpc).toContain('"request_account_deletion_for_user"');
    expect(privacyRpc).toContain('"cancel_account_deletion_for_user"');
    expect(privacyRpc).not.toContain('p_user_id: params.userId');
  });

  it('does not reintroduce legacy deletion storage or destructive purge behavior', () => {
    expect(reconcileMigration).not.toContain('user_deletion_schedule');
    expect(reconcileMigration).not.toContain('profiles.deleted_at');
    expect(reconcileMigration).not.toMatch(/UPDATE\s+public\.profiles/i);
    expect(reconcileMigration).not.toContain('DELETE FROM auth.users');
    expect(reconcileMigration).not.toContain('DROP TABLE');
    expect(privacyRpc).not.toContain('auth.admin.deleteUser');
  });
});
