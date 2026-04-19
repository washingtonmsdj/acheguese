/**
 * GeospatialRepositorySupabase
 * 
 * Implementação Supabase com PostGIS.
 */

import { supabase } from '@/integrations/supabase';
import type { IGeospatialRepository } from './IGeospatialRepository';
import type { PointResolutionResult, ResolvePointInput, BoundaryGeoJSON } from '../types';

export class GeospatialRepositorySupabase implements IGeospatialRepository {
  async resolvePointToLocation(input: ResolvePointInput): Promise<PointResolutionResult | null> {
    const { latitude, longitude, location_type = 'district' } = input;

    const { data, error } = await supabase
      .rpc('resolve_point_to_location', {
        lat: latitude,
        lng: longitude,
        location_type,
      })
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as PointResolutionResult | null;
  }

  async resolvePointToLocationWithFallback(input: ResolvePointInput): Promise<PointResolutionResult | null> {
    const { latitude, longitude, location_type = 'district' } = input;

    const { data, error } = await supabase
      .rpc('resolve_point_to_location_with_fallback', {
        lat: latitude,
        lng: longitude,
        location_type,
      })
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as PointResolutionResult | null;
  }

  async hasBoundary(locationId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('locations')
      .select('boundary')
      .eq('id', locationId)
      .maybeSingle();

    if (error) throw error;
    return data?.boundary !== null;
  }

  async setLocationBoundary(locationId: string, boundary: BoundaryGeoJSON): Promise<void> {
    // Converter GeoJSON para WKT para PostGIS
    const wkt = this.geoJSONToWKT(boundary);

    const { error } = await supabase
      .from('locations')
      .update({
        boundary: supabase.rpc('ST_GeomFromText', { wkt, srid: 4326 }),
      })
      .eq('id', locationId);

    if (error) throw error;
  }

  async getLocationBoundary(locationId: string): Promise<BoundaryGeoJSON | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('boundary')
      .eq('id', locationId)
      .maybeSingle();

    if (error) throw error;
    if (!data?.boundary) return null;

    // Converter de PostGIS para GeoJSON
    // Nota: Supabase retorna geometry como GeoJSON automaticamente
    return data.boundary as BoundaryGeoJSON;
  }

  // ============================================
  // HELPERS
  // ============================================

  private geoJSONToWKT(geojson: BoundaryGeoJSON): string {
    const coords = geojson.coordinates[0]
      .map(([lng, lat]) => `${lng} ${lat}`)
      .join(', ');
    return `POLYGON((${coords}))`;
  }
}
