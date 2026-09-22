import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Business spatial read-model ownership', () => {
  const migration = readProjectFile(
    'supabase/migrations/20260920094744_retarget_business_spatial_search_read_model_g154.sql',
  );

  it('routes every Business spatial RPC through public_business_search', () => {
    for (const functionName of [
      'search_entities_by_radius',
      'search_entities_by_bounds',
      'search_entities_hybrid',
    ]) {
      expect(migration).toContain(`FUNCTION public.${functionName}(`);
    }

    const executableSql = migration
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");

    expect(executableSql.match(/FROM public\.public_business_search b/g)?.length).toBe(3);
    expect(executableSql).not.toMatch(
      /^\s*FROM\s+(?:public\.)?businesses\s+b\b/im,
    );
  });

  it('returns canonical profile identity for Business consumers', () => {
    expect(migration.match(/b\.profile_id AS id/g)?.length).toBe(3);
    expect(migration).toContain('b.business_name AS name');
  });

  it('keeps spatial reads bounded and search_path explicit even for null limits', () => {
    expect(migration).toContain("SET search_path TO 'pg_catalog', 'public', 'pg_temp'");
    expect(migration).toContain('LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)');
    expect(migration).toContain('LEAST(GREATEST(COALESCE(p_limit, 100), 1), 200)');
    expect(migration).toContain('GREATEST(COALESCE(p_offset, 0), 0)');
  });
});
