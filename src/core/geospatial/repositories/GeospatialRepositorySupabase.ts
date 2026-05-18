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
    const { error } = await supabase
      .from('locations')
      .update({
        boundary: boundary as unknown,
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
}
