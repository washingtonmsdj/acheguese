import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const purgeMatrix = JSON.parse(
  readFileSync(
    join(
      root,
      'docs/09-reference/governance/privacy/LGPD_PURGE_MATRIX.json',
    ),
    'utf8',
  ),
) as {
  schemaVersion: string;
  implementationComplete: boolean;
  rules: Record<string, unknown>;
  snapshot: {
    blockingReferenceCount: number;
    authUsersBlockingReferenceCount: number;
    profilesBlockingReferenceCount: number;
    nullableBlockingReferenceCount: number;
    requiredBlockingReferenceCount: number;
  };
  blockingReferences: Array<{
    constraint: string;
    source: string;
    target: string;
    deleteAction: string;
    nullable: boolean;
    decision: string;
  }>;
};
const preflight = readFileSync(
  join(root, 'tools/security/supabase-lgpd-edge-rollout-preflight.mjs'),
  'utf8',
);
const deleteHandler = readFileSync(
  join(root, 'supabase/functions/user-delete-account/index.ts'),
  'utf8',
);

describe('LGPD destructive purge readiness gate', () => {
  it('keeps the live blocking-FK snapshot explicit and fail-closed', () => {
    expect(purgeMatrix.schemaVersion).toBe('lgpd-purge-matrix/v1');
    expect(purgeMatrix.implementationComplete).toBe(false);
    expect(purgeMatrix.rules.default).toBe('block');
    expect(purgeMatrix.rules.unclassifiedReference).toBe('block');
    expect(
      purgeMatrix.rules.authUserDeleteRequiresZeroUnclassifiedReferences,
    ).toBe(true);
    expect(
      purgeMatrix.rules.profileDeleteRequiresZeroUnclassifiedReferences,
    ).toBe(true);

    expect(purgeMatrix.snapshot).toEqual({
      blockingReferenceCount: 28,
      authUsersBlockingReferenceCount: 20,
      profilesBlockingReferenceCount: 8,
      nullableBlockingReferenceCount: 25,
      requiredBlockingReferenceCount: 3,
    });
    expect(purgeMatrix.blockingReferences).toHaveLength(28);
    expect(
      new Set(purgeMatrix.blockingReferences.map((entry) => entry.constraint)).size,
    ).toBe(28);
    expect(
      purgeMatrix.blockingReferences.every(
        (entry) => entry.decision === 'unclassified',
      ),
    ).toBe(true);
  });

  it('records the three non-null RESTRICT references that cannot be solved by SET NULL', () => {
    const required = purgeMatrix.blockingReferences
      .filter((entry) => entry.nullable === false)
      .map((entry) => entry.constraint)
      .sort();

    expect(required).toEqual([
      'communication_publications_author_profile_id_fkey',
      'community_user_moderation_actions_actor_profile_id_fkey',
      'trust_admin_actions_applied_by_profile_id_fkey',
    ]);
    expect(
      purgeMatrix.blockingReferences.filter((entry) => entry.nullable === true),
    ).toHaveLength(25);
  });

  it('requires the purge matrix and an explicit implementation certification before delete rollout', () => {
    expect(preflight).toContain("const PURGE_MATRIX_SCHEMA_VERSION = 'lgpd-purge-matrix/v1'");
    expect(preflight).toContain('requiresPurgeMatrix: true');
    expect(preflight).toContain(
      "'const LGPD_PURGE_IMPLEMENTATION_COMPLETE = true;'",
    );
    expect(preflight).toContain('function inspectPurgeMatrix()');
    expect(preflight).toContain("reference?.decision === 'unclassified'");
    expect(preflight).toContain('matrix?.implementationComplete === true');
    expect(preflight).toContain('unresolvedReferences === 0');
  });

  it('keeps the current destructive delete handler blocked', () => {
    expect(deleteHandler).not.toContain(
      'const LGPD_PURGE_IMPLEMENTATION_COMPLETE = true;',
    );
    expect(deleteHandler).toContain(".from('user_deletion_schedule')");
    expect(deleteHandler).toContain(".eq('owner_id', userId)");
    expect(deleteHandler).toContain(".eq('passenger_id', userId)");
  });
});
