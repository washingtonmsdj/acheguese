import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const RETIRED_FOUNDATION = join(
  ROOT,
  'supabase/migrations/20260821011000_create_account_deletion_request_authority.sql',
);
const CANONICAL_RECONCILE = readFileSync(
  join(
    ROOT,
    'supabase/migrations/20260826015916_reconcile_account_deletion_authority_live_drift.sql',
  ),
  'utf8',
);
const PROVENANCE = readFileSync(
  join(ROOT, 'docs/10-archive/migrations/G5_LOCAL_ONLY_PROVENANCE.md'),
  'utf8',
);

describe('account deletion authority foundation provenance', () => {
  it('keeps the never-applied historical foundation out of the active migration queue', () => {
    expect(existsSync(RETIRED_FOUNDATION)).toBe(false);
    expect(PROVENANCE).toContain(
      '20260821011000_create_account_deletion_request_authority.sql',
    );
    expect(PROVENANCE).toContain(
      'LOCAL_ONLY_SUPERSEDED_BY_FORWARD_RECONCILIATION',
    );
    expect(PROVENANCE).toContain(
      '20260826015916_reconcile_account_deletion_authority_live_drift.sql',
    );
    expect(PROVENANCE).toContain('Não aplicar, não renomear como alias e não reintroduzir');
  });

  it('preserves a reversible request state and grace period in the canonical authority', () => {
    expect(CANONICAL_RECONCILE).toContain(
      "status IN ('scheduled', 'cancelled', 'processing', 'completed', 'failed')",
    );
    expect(CANONICAL_RECONCILE).toContain("v_now + INTERVAL '30 days'");
    expect(CANONICAL_RECONCILE).toContain(
      'export_requested = export_requested OR COALESCE(p_export_requested, FALSE)',
    );
    expect(CANONICAL_RECONCILE).not.toContain('DELETE FROM auth.users');
    expect(CANONICAL_RECONCILE).not.toContain('DROP TABLE');
  });

  it('keeps cancellation independent from removed profile soft-delete storage', () => {
    expect(CANONICAL_RECONCILE).toContain(
      'CREATE OR REPLACE FUNCTION public.cancel_account_deletion_for_user',
    );
    expect(CANONICAL_RECONCILE).toContain("status = 'cancelled'");
    expect(CANONICAL_RECONCILE).not.toContain('user_deletion_schedule');
    expect(CANONICAL_RECONCILE).not.toContain('profiles.deleted_at');
    expect(CANONICAL_RECONCILE).not.toMatch(/UPDATE\s+public\.profiles/i);
  });

  it('keeps account deletion table and RPC authority broker-only', () => {
    expect(CANONICAL_RECONCILE).toContain(
      'ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY',
    );
    expect(CANONICAL_RECONCILE).toContain(
      'REVOKE ALL ON TABLE public.account_deletion_requests FROM authenticated',
    );
    expect(CANONICAL_RECONCILE).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role',
    );

    for (const signature of [
      'public.get_account_deletion_status_for_user(UUID)',
      'public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN)',
      'public.cancel_account_deletion_for_user(UUID, TEXT)',
    ]) {
      expect(CANONICAL_RECONCILE).toContain(
        `REVOKE ALL ON FUNCTION ${signature} FROM authenticated`,
      );
      expect(CANONICAL_RECONCILE).toContain(
        `GRANT EXECUTE ON FUNCTION ${signature} TO service_role`,
      );
    }
  });

  it('keeps pending-deletion writes fail closed across application-owned public tables', () => {
    expect(CANONICAL_RECONCILE).toContain(
      'CREATE FUNCTION private.guard_pending_deletion_write()',
    );
    expect(CANONICAL_RECONCILE).toContain(
      "RAISE EXCEPTION 'ACCOUNT_PENDING_DELETION_READ_ONLY'",
    );
    expect(CANONICAL_RECONCILE).toContain(
      'CREATE FUNCTION private.ensure_pending_deletion_write_guards()',
    );
    expect(CANONICAL_RECONCILE).toContain(
      'pending deletion DML guard coverage mismatch: expected %, guarded %',
    );
  });

  it('stays forward-only without overwriting newer authorization helpers', () => {
    expect(CANONICAL_RECONCILE).toContain('This forward-only migration installs');
    expect(CANONICAL_RECONCILE).toContain('without redefining those newer helpers');
    expect(CANONICAL_RECONCILE).not.toMatch(
      /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+private\.(?:current_active_profile_id|auth_owns_usable_profile|auth_can_access_profile|can_manage_profile|auth_participates_community_direct_thread)\b/i,
    );
  });
});
