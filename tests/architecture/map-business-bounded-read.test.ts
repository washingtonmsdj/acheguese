import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('business map bounded read', () => {
  const service = readProjectFile(
    'src/core/maps/services/MapBusinessLayerRuntimeService.ts',
  );
  const migration = readProjectFile(
    'supabase/migrations/20260913004500_index_public_business_map_bounds_g154.sql',
  );

  it('filters viewport and territory in the database-backed public read model', () => {
    expect(service).toContain('.from<BusinessMapRow>("public_business_search")');
    expect(service).toContain('.gte("longitude", west)');
    expect(service).toContain('.lte("longitude", east)');
    expect(service).toContain('.gte("latitude", south)');
    expect(service).toContain('.lte("latitude", north)');
    expect(service).toContain('applyTerritoryFilter(query, territoryFilter)');
    expect(service).not.toContain('BusinessService.getBusinesses(');
    expect(service).not.toContain('isInsideBounds');
  });

  it('bounds result cardinality and rejects the retired businesses spatial table', () => {
    expect(service).toContain('MAX_BUSINESS_MAP_LIMIT = 200');
    expect(service).toContain('.limit(limit)');
    expect(service).not.toContain('from<BusinessMapRow>("businesses")');
  });

  it('indexes both coordinate axes on the canonical public read model', () => {
    expect(migration).toContain('ON public.public_business_search (latitude)');
    expect(migration).toContain('ON public.public_business_search (longitude)');
    expect(migration).not.toContain('ON public.businesses');
  });
});
