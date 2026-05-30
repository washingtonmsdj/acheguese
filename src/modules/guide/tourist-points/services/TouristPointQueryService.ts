/**
 * TouristPointQueryService
 *
 * Canonical read owner for tourist_points.
 * Keeps all read logic in core and avoids parallel query services.
 */

import { supabase } from '@/core/infrastructure/supabase';
import type { TerritoryFilter } from '@/core/location/types';
import type { TouristPoint } from '../types';

const SELECT_PUBLIC = `
  id,
  location_id,
  address_id,
  slug,
  title,
  summary,
  description,
  category,
  rating,
  total_reviews,
  accessibility,
  accessibility_level,
  neighborhood,
  address_text,
  price_type,
  price_text,
  opening_hours,
  accessibility_notes,
  official_url,
  is_featured,
  status,
  published_at,
  created_at,
  updated_at,
  created_by,
  updated_by,
  location:locations!location_id(id, name, full_name, geographic_path, type),
  address:addresses!address_id(latitude, longitude),
  media:tourist_point_media(id, url, alt_text, is_cover, display_order)
`;

export interface TouristPointQueryFilters {
  location_ids: string[];
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export class TouristPointQueryService {
  static async resolveLocationIdsFromFilter(filter: TerritoryFilter): Promise<string[]> {
    if (filter.scope === 'location') {
      return this.expandLocationIds(filter.location_id);
    }

    if (filter.scope === 'group') {
      return filter.location_ids;
    }

    return [];
  }

  static async expandLocationIds(locationId: string): Promise<string[]> {
    const { data: location } = await supabase
      .from('locations')
      .select('id, type')
      .eq('id', locationId)
      .single();

    if (!location) return [locationId];

    if (location.type === 'district' || location.type === 'neighborhood') {
      return [locationId];
    }

    if (location.type === 'city') {
      const { data: neighborhoods } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', locationId)
        .eq('type', 'neighborhood')
        .eq('status', 'active');

      if (neighborhoods && neighborhoods.length > 0) {
        return [locationId, ...neighborhoods.map((neighborhood) => neighborhood.id)];
      }

      const { data: districts } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', locationId)
        .eq('type', 'district')
        .eq('status', 'active');

      if (districts && districts.length > 0) {
        return [locationId, ...districts.map((district) => district.id)];
      }
    }

    return [locationId];
  }

  static async listPublished(filters: TouristPointQueryFilters): Promise<TouristPoint[]> {
    if (!filters.location_ids.length) return [];

    try {
      let query = supabase
        .from('tourist_points')
        .select(SELECT_PUBLIC)
        .in('location_id', filters.location_ids)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as unknown as TouristPoint[];
    } catch {
      return [];
    }
  }

  static async getPublishedBySlug(locationId: string, slug: string): Promise<TouristPoint | null> {
    try {
      const locationIds = await this.expandLocationIds(locationId);

      const { data, error } = await supabase
        .from('tourist_points')
        .select(SELECT_PUBLIC)
        .in('location_id', locationIds)
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error || !data) return null;
      return data as unknown as TouristPoint;
    } catch {
      return null;
    }
  }

  static async countPublished(locationIds: string[]): Promise<number> {
    if (!locationIds.length) return 0;

    try {
      const { count, error } = await supabase
        .from('tourist_points')
        .select('*', { count: 'exact', head: true })
        .in('location_id', locationIds)
        .eq('status', 'published');

      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }

  static async listAdmin(filters: TouristPointQueryFilters): Promise<TouristPoint[]> {
    try {
      let query = supabase
        .from('tourist_points')
        .select(SELECT_PUBLIC)
        .order('updated_at', { ascending: false });

      if (filters.location_ids.length > 0) {
        query = query.in('location_id', filters.location_ids);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as unknown as TouristPoint[];
    } catch {
      return [];
    }
  }

  static async getById(id: string): Promise<TouristPoint | null> {
    try {
      const { data, error } = await supabase
        .from('tourist_points')
        .select(SELECT_PUBLIC)
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return data as unknown as TouristPoint;
    } catch {
      return null;
    }
  }
}

