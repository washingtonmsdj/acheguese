import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

describe('platform function contracts', () => {
  it('drops only proven obsolete application functions without cascade', () => {
    const migration = read(
      'supabase/migrations/20260717141000_repair_platform_function_contracts.sql',
    );

    for (const functionName of [
      'create_business_data_with_canonical',
      'create_professional_data_with_canonical',
      'create_ride_request_with_canonical',
      'create_user_residence_with_canonical',
      'delivery_assert_actor_profile',
      'exec_sql',
      'revoke_all_user_sessions',
      'get_location_ancestors',
      'get_location_by_path',
      'get_location_descendants',
    ]) {
      expect(migration).toContain(`DROP FUNCTION IF EXISTS public.${functionName}`);
    }

    expect(migration).not.toMatch(/DROP FUNCTION[^;]+CASCADE/i);
    expect(migration).not.toMatch(/(?:ALTER|DROP|CREATE OR REPLACE FUNCTION) public\.st_/i);
  });

  it('bounds background processing and keeps privileged commands server-only', () => {
    const migration = read(
      'supabase/migrations/20260717141000_repair_platform_function_contracts.sql',
    );

    expect(migration).toContain('FOR UPDATE OF request SKIP LOCKED');
    expect(migration).toContain('LIMIT 100');
    expect(migration).toContain("COALESCE(auth.role(), '') <> 'service_role'");
    expect(migration).toContain('role.is_active = TRUE');
    expect(migration).toContain('role.revoked_at IS NULL');
    expect(migration).toContain('v_order.logistics_status::public.logistics_status');
    expect(migration).toContain('actor_role = v_actor_role');
    expect(migration).toContain('reason = left(NULLIF(trim(COALESCE(p_reason');
  });

  it('uses current Trust schema types and profile suspension ownership', () => {
    const migration = read(
      'supabase/migrations/20260717142000_repair_trust_function_contracts.sql',
    );

    expect(migration).toContain('order_row.id = v_ride.source_id');
    expect(migration).not.toContain('order_row.id::TEXT = v_ride.source_id');
    expect(migration).toContain('JOIN public.profiles profile ON profile.id = driver.profile_id');
    expect(migration).not.toContain('driver.is_suspended');
    expect(migration).toContain(')::public.delivery_occurrence_severity');
    expect(migration).toContain('profile.suspended_until IS NULL');
  });
});
