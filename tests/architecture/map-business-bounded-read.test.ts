import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('business map bounded read', () => {
  const mapAdapter = readProjectFile(
    'src/core/maps/services/MapBusinessLayerRuntimeService.ts',
  );
  const businessService = readProjectFile(
    'src/core/business/services/BusinessMapQueryService.ts',
  );
  const mapPage = readProjectFile(
    'src/core/maps/pages/MapaPageV4.tsx',
  );
  const migration = readProjectFile(
    'supabase/migrations/20260920094738_index_public_business_map_bounds_g154.sql',
  );

  it('filters viewport and territory in the database-backed public read model', () => {
    expect(businessService).toContain('.from<BusinessMapRow>("public_business_search")');
    expect(businessService).toContain('.gte("longitude", west)');
    expect(businessService).toContain('.lte("longitude", east)');
    expect(businessService).toContain('.gte("latitude", south)');
    expect(businessService).toContain('.lte("latitude", north)');
    expect(businessService).toContain('applyTerritoryFilter(query, territoryFilter)');
    expect(businessService).toContain('public_business_search_location_id_fkey');
    expect(businessService).toContain('BusinessUrlService.getPublicCanonicalUrl');
    expect(businessService).toContain('canonical_url: canonicalUrl');
    expect(businessService).not.toContain('isInsideBounds');

    expect(mapAdapter).toContain('businessMapQueryService.getBusinessesByBounds');
    expect(mapAdapter).not.toContain('public_business_search');
    expect(mapAdapter).not.toContain('@integrations/supabase');
    expect(mapAdapter).not.toContain('applyTerritoryFilter');
  });

  it('keeps map surfaces on the bounded Business map boundary', () => {
    expect(mapPage).toContain('mapBusinessLayerRuntimeService.getBusinessesByBounds(bounds');
    expect(mapPage).not.toContain('BusinessService.getBusinesses(');
  });

  it('bounds result cardinality and rejects the retired businesses spatial table', () => {
    expect(businessService).toContain('MAX_BUSINESS_MAP_LIMIT = 200');
    expect(businessService).toContain('.limit(limit)');
    expect(businessService).not.toContain('from<BusinessMapRow>("businesses")');
  });

  it('indexes rectangular and radius searches on the canonical public read model', () => {
    expect(migration).toContain('ON public.public_business_search (latitude)');
    expect(migration).toContain('ON public.public_business_search (longitude)');
    expect(migration).toContain('public_business_search_geography_idx');
    expect(migration).toContain('USING gist');
    expect(migration).not.toContain('ON public.businesses');
  });
});
