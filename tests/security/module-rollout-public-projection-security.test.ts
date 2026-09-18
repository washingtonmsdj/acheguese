import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositorySource = readFileSync(
  join(
    process.cwd(),
    'src/core/rollout/repositories/RolloutRepositorySupabase.ts',
  ),
  'utf8',
);

describe('module rollout browser projection', () => {
  it('uses one explicit browser-facing projection instead of SELECT *', () => {
    expect(repositorySource).toContain(
      '"id,module_key,location_id,status,config,created_at,updated_at"',
    );
    expect(repositorySource).not.toContain('.select("*")');
    expect(repositorySource).not.toContain('.select("*",');
    expect(repositorySource).not.toMatch(/\.select\(\s*\)\s*\.single\(\)/);
  });

  it('keeps rollout actor metadata out of browser-facing selects', () => {
    const projection = repositorySource.match(
      /const PUBLIC_ROLLOUT_COLUMNS\s*=\s*\n?\s*"([^"]+)"/,
    )?.[1];

    expect(projection).toBeDefined();
    expect(projection?.split(',')).toEqual([
      'id',
      'module_key',
      'location_id',
      'status',
      'config',
      'created_at',
      'updated_at',
    ]);
    expect(projection).not.toContain('created_by');
    expect(projection).not.toContain('updated_by');
  });

  it('keeps public reads direct while routing mutations through the admin broker', () => {
    expect(
      repositorySource.match(/\.select\(PUBLIC_ROLLOUT_COLUMNS/g)?.length ?? 0,
    ).toBe(4);
    expect(repositorySource).toContain(
      '.select(PUBLIC_ROLLOUT_COLUMNS, { count: "exact" })',
    );
    expect(repositorySource).toContain('"admin-rollout-rpc"');
    expect(repositorySource).toContain('action: "upsertRollout"');
    expect(repositorySource).toContain('action: "deleteRollout"');
    expect(repositorySource).not.toContain('.upsert(');
    expect(repositorySource).not.toContain('.delete()');
  });
});
