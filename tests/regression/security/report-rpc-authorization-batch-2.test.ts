import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const migration = readFileSync(
  resolve(root, 'supabase/migrations/20260820084132_harden_vaga_review_ride_report_rpc_contract.sql'),
  'utf8',
);
const sqlSpec = readFileSync(
  resolve(root, 'supabase/tests/report_rpc_authorization_batch_2_spec.sql'),
  'utf8',
);

const signatures = [
  'create_vaga_report(uuid, text, text)',
  'moderate_vaga_report(uuid, text, text)',
  'create_review_report(uuid, text, text)',
  'moderate_review_report(uuid, text, text)',
  'create_ride_report(\n  uuid, text, text, text, text, text[], double precision, double precision\n)',
  'moderate_ride_report(uuid, text, text, text)',
] as const;

describe('regression: report RPC authorization batch 2', () => {
  it('keeps every report wrapper/helper authenticated-only in the migration', () => {
    for (const signature of signatures) {
      for (const schema of ['public', 'private'] as const) {
        const qualified = `${schema}.${signature}`;
        expect(migration).toContain(`revoke execute on function ${qualified}`);
        expect(migration).toContain(`grant execute on function ${qualified}`);
      }
    }

    expect(migration).toContain('from public, anon, service_role;');
    expect(migration).toContain('to authenticated;');
    expect(migration).not.toMatch(/grant\s+execute[\s\S]*?\bto\s+(?:anon|service_role)\b/i);
  });

  it('locks SECURITY mode, search_path and denied roles in the SQL spec', () => {
    for (const name of [
      'create_vaga_report',
      'moderate_vaga_report',
      'create_review_report',
      'moderate_review_report',
      'create_ride_report',
      'moderate_ride_report',
    ]) {
      expect(sqlSpec).toContain(`public.${name}`);
      expect(sqlSpec).toContain(`private.${name}`);
    }

    expect(sqlSpec).toContain("'search_path=private, pg_temp'");
    expect(sqlSpec).toContain("'search_path=public, private, pg_temp'");
    expect(sqlSpec).toContain("has_function_privilege('authenticated', v_oid, 'EXECUTE')");
    expect(sqlSpec).toContain("has_function_privilege('anon', v_oid, 'EXECUTE')");
    expect(sqlSpec).toContain("has_function_privilege('service_role', v_oid, 'EXECUTE')");
    expect(sqlSpec).toContain('unexpected SECURITY DEFINER mode');
  });

  it('keeps the migration transaction-scoped and free of unrelated DDL', () => {
    expect(migration.trimStart().toLowerCase()).toMatch(/^begin;/);
    expect(migration.trimEnd().toLowerCase()).toMatch(/commit;$/);
    expect(migration).not.toMatch(/\b(?:drop|alter|create)\s+(?:table|schema|type)\b/i);
  });
});