import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(repoRoot, path), 'utf8');

describe('coverage command security', () => {
  it('keeps coverage mutations atomic and server-authorized', () => {
    const migration = read(
      'supabase/migrations/20260717140000_consolidate_coverage_commands.sql',
    );
    const repository = read(
      'src/core/coverage/repositories/CoverageRepositorySupabase.ts',
    );

    expect(migration).toContain('private.require_coverage_entity_write');
    expect(migration).toContain('private.current_active_profile_id()');
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('jsonb_array_length(p_coverages)');
    expect(migration).toContain('location.status <> \'active\'');
    expect(migration).toContain(
      'REVOKE ALL PRIVILEGES ON TABLE public.service_areas FROM PUBLIC, anon, authenticated',
    );
    expect(migration).toContain(
      'GRANT SELECT ON TABLE public.service_areas TO anon, authenticated',
    );

    expect(repository).toContain(".rpc('replace_entity_coverage'");
    expect(repository).toContain(".rpc('remove_entity_coverage'");
    expect(repository).toContain(".rpc('update_entity_coverage_status'");
    expect(repository).not.toMatch(/\.from\(TABLE\)\s*\.insert/);
    expect(repository).not.toMatch(/\.from\(TABLE\)\s*\.update/);
    expect(repository).not.toMatch(/\.from\(TABLE\)\s*\.delete/);
  });

  it('removes the duplicate geospatial coverage runtime', () => {
    for (const path of [
      'src/core/geospatial/services/CoverageService.ts',
      'src/core/geospatial/hooks/useCoverage.ts',
      'src/core/geospatial/components/CoverageBadge.tsx',
      'src/core/geospatial/components/CoverageSettingsForm.tsx',
      'src/core/coverage/sql/001_coverage_table.sql',
      'src/core/coverage/sql/002_coverage_rls.sql',
    ]) {
      expect(existsSync(resolve(repoRoot, path)), path).toBe(false);
    }

    const geospatialBarrel = read('src/core/geospatial/index.ts');
    expect(geospatialBarrel).not.toContain("./services/CoverageService");
    expect(geospatialBarrel).not.toContain("./hooks/useCoverage");
  });
});
