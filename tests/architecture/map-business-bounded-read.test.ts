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
  const mapPage = readProjectFile(
    'src/core/maps/pages/MapaPageV4.tsx',
  );
  const cityPage = readProjectFile(
    'src/app/pages/CidadeLandingPage.tsx',
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
    expect(service).toContain('public_business_search_location_id_fkey');
    expect(service).toContain('geographic_path: location?.geographic_path ?? null');
    expect(service).not.toContain('BusinessService.getBusinesses(');
    expect(service).not.toContain('isInsideBounds');
  });

  it('keeps map surfaces on the bounded Business map boundary', () => {
    expect(mapPage).toContain('mapBusinessLayerRuntimeService.getBusinessesByBounds(bounds');
    expect(mapPage).not.toContain('BusinessService.getBusinesses(');

    expect(cityPage).toContain('mapBusinessLayerRuntimeService.getBusinessesByBounds(bounds');
    expect(cityPage).not.toContain('BusinessService.getBusinesses(');
  });

  it('bounds result cardinality and rejects the retired businesses spatial table', () => {
    expect(service).toContain('MAX_BUSINESS_MAP_LIMIT = 200');
    expect(service).toContain('.limit(limit)');
    expect(service).not.toContain('from<BusinessMapRow>("businesses")');
  });

  it('indexes rectangular and radius searches on the canonical public read model', () => {
    expect(migration).toContain('ON public.public_business_search (latitude)');
    expect(migration).toContain('ON public.public_business_search (longitude)');
    expect(migration).toContain('public_business_search_geography_idx');
    expect(migration).toContain('USING gist');
    expect(migration).not.toContain('ON public.businesses');
  });
});
