/**
 * LocationAdminService
 *
 * Canonical admin service for locations domain.
 * Owns admin CRUD boundaries for location records.
 */

import { supabase } from '@/integrations/supabase/supabase';
import { createLocationRepository } from '../repositories/createLocationRepository';
import type { Location, LocationMetadata, LocationType } from '../types';

export type AdminLocationRecord = Location;

export interface CreateAdminLocationInput {
  parent_id: string | null;
  type: LocationType;
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  metadata: LocationMetadata;
}

export class LocationAdminService {
  static async listLocations(): Promise<AdminLocationRecord[]> {
    const repository = createLocationRepository();
    const locations = await repository.findAll();

    return [...locations].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.name.localeCompare(b.name);
    });
  }

  static async getLocationById(locationId: string): Promise<AdminLocationRecord | null> {
    const repository = createLocationRepository();
    return repository.findById(locationId);
  }

  static async getParentSummary(parentId: string): Promise<{ full_name: string; geographic_path: string } | null> {
    const repository = createLocationRepository();
    const parent = await repository.findById(parentId);

    if (!parent) return null;

    return {
      full_name: parent.full_name,
      geographic_path: parent.geographic_path,
    };
  }

  static async createLocation(input: CreateAdminLocationInput): Promise<void> {
    const { error } = await supabase.from('locations').insert(input);
    if (error) throw error;
  }

  static async updateLocation(
    locationId: string,
    updates: Partial<Pick<AdminLocationRecord, 'name' | 'slug' | 'metadata'>>,
  ): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', locationId);

    if (error) throw error;
  }
}

export const locationAdminService = LocationAdminService;


