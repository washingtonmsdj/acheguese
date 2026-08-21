import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION = join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260821011000_create_account_deletion_request_authority.sql',
);

describe('account deletion authority foundation', () => {
  it('fails closed on unversioned pre-existing authority state', () => {
    const sql = readFileSync(MIGRATION, 'utf8');

    expect(sql).toContain("IF to_regclass('public.account_deletion_requests') IS NOT NULL THEN");
    expect(sql).toContain("'public.request_account_deletion_for_user(uuid,text,boolean)'");
    expect(sql).toContain('already exists before its authority migration');
    expect(sql).toContain('CREATE TABLE public.account_deletion_requests');
    expect(sql).not.toContain('CREATE TABLE IF NOT EXISTS public.account_deletion_requests');
    expect(sql).not.toContain('CREATE INDEX IF NOT EXISTS account_deletion_requests_due_idx');
  });

  it('creates a reversible request state without performing destructive purge', () => {
    const sql = readFileSync(MIGRATION, 'utf8');

    expect(sql).toContain('CREATE TABLE public.account_deletion_requests');
    expect(sql).toContain("status IN ('scheduled', 'cancelled', 'processing', 'completed', 'failed')");
    expect(sql).toContain("v_now + INTERVAL '30 days'");
    expect(sql).toContain('profile_state_snapshot JSONB');
    expect(sql).toContain('role_state_snapshot JSONB');

    expect(sql).not.toContain('DELETE FROM auth.users');
    expect(sql).not.toContain('auth.admin.deleteUser');
    expect(sql).not.toContain('DROP TABLE');
  });

  it('replaces the broken cancellation RPC without depending on removed profile soft-delete columns', () => {
    const sql = readFileSync(MIGRATION, 'utf8');

    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.cancel_account_deletion_for_user');
    expect(sql).toContain('FROM public.account_deletion_requests');
    expect(sql).toContain("IF v_request.status = 'cancelled' THEN");
    expect(sql).toContain("status = 'cancelled'");

    expect(sql).not.toContain('user_deletion_schedule');
    expect(sql).not.toContain('profiles.deleted_at');
    expect(sql).not.toMatch(/UPDATE\s+public\.profiles/i);
  });

  it('keeps request and cancel RPCs service-role-only with least table privilege', () => {
    const sql = readFileSync(MIGRATION, 'utf8');

    expect(sql).toContain('ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('REVOKE ALL ON TABLE public.account_deletion_requests FROM PUBLIC');
    expect(sql).toContain('REVOKE ALL ON TABLE public.account_deletion_requests FROM anon');
    expect(sql).toContain('REVOKE ALL ON TABLE public.account_deletion_requests FROM authenticated');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role');
    expect(sql).toContain("'REFERENCES', 'TRIGGER', 'MAINTAIN'");
    expect(sql).toContain("service_role unexpectedly has % on account_deletion_requests");

    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) TO service_role');
    expect(sql).toContain("RAISE EXCEPTION 'browser role can execute request_account_deletion_for_user'");
    expect(sql).toContain("RAISE EXCEPTION 'browser role can execute cancel_account_deletion_for_user'");
  });

  it('asserts RLS, SECURITY DEFINER and fixed runtime config through the catalog', () => {
    const sql = readFileSync(MIGRATION, 'utf8');

    expect(sql).toContain('AND relrowsecurity');
    expect(sql).toContain("RAISE EXCEPTION 'RLS is not enabled on account_deletion_requests'");
    expect(sql).toContain('SELECT prosecdef, proconfig');
    expect(sql).toContain("'search_path=pg_catalog, public, pg_temp'");
    expect(sql).toContain("'statement_timeout=5s'");
    expect(sql).toContain("RAISE EXCEPTION 'deletion request authority function is not SECURITY DEFINER'");
    expect(sql).toContain("RAISE EXCEPTION 'request_account_deletion_for_user runtime config drifted'");
    expect(sql).toContain("RAISE EXCEPTION 'cancel_account_deletion_for_user runtime config drifted'");
  });

  it('makes retries idempotent without extending an existing scheduled grace window', () => {
    const sql = readFileSync(MIGRATION, 'utf8');

    const scheduledBranch = sql.match(
      /IF v_request\.status = 'scheduled' THEN([\s\S]*?)ELSIF v_request\.status IN \('cancelled', 'failed'\) THEN/,
    )?.[1] ?? '';

    expect(scheduledBranch).toContain('export_requested = export_requested OR');
    expect(scheduledBranch).not.toContain("INTERVAL '30 days'");
    expect(scheduledBranch).not.toContain('scheduled_purge_at =');
  });
});
