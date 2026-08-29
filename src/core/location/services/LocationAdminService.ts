/**
 * LocationAdminService
 *
 * Canonical admin service for locations domain.
 * Owns structural CRUD for location records and non-territorial metadata edits.
 * Territorial visibility flags are owned by core/territorial and its hardened
 * Edge Functions; this service must preserve those flags on metadata updates.
 */

import { supabase } from '@/integrations/supabase';
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase';
import { createLocationRepository } from '../repositories/createLocationRepository';
import type { Location, LocationMetadata, LocationType } from '../types';

type ErrorLike = {
  message?: string | null;
};

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  eq(column: string, value: unknown): TableClient<TRow>;
  insert(values: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>): TableClient<TRow>;
  select(columns?: string): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
};

type LocationAdminDbClient = {
  from<TRow>(table: string): TableClient<TRow>;
};

type LocationRow = Tables<'locations'>;
type LocationInsert = TablesInsert<'locations'>;
type LocationUpdate = TablesUpdate<'locations'>;

const locationAdminDb = supabase as unknown as LocationAdminDbClient;

const TERRITORIAL_VISIBILITY_METADATA_KEYS = [
  'is_selector_active',
  'is_landing_enabled',
  'is_navigable',
] as const;

function toJsonMetadata(metadata: LocationMetadata): Json {
  return metadata as Json;
}

function preserveTerritorialVisibilityMetadata(
  currentMetadata: LocationMetadata,
  requestedMetadata: LocationMetadata,
): LocationMetadata {
  const sanitized: LocationMetadata = { ...requestedMetadata };

  for (const key of TERRITORIAL_VISIBILITY_METADATA_KEYS) {
    if (Object.prototype.hasOwnProperty.call(currentMetadata, key)) {
      sanitized[key] = currentMetadata[key];
    } else {
      delete sanitized[key];
    }
  }

  return sanitized;
}

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
  private static readonly db = locationAdminDb;

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
    const payload: LocationInsert = {
      ...input,
      metadata: toJsonMetadata(input.metadata),
    };

    const { error } = await this.db.from<LocationRow>('locations').insert(payload);
    if (error) throw error;
  }

  static async updateLocation(
    locationId: string,
    updates: Partial<Pick<AdminLocationRecord, 'name' | 'slug' | 'metadata'>>,
  ): Promise<void> {
    let metadataForUpdate: LocationMetadata | undefined;
    let expectedMetadata: LocationMetadata | undefined;

    if (updates.metadata !== undefined) {
      const repository = createLocationRepository();
      const currentLocation = await repository.findById(locationId);

      if (!currentLocation) {
        throw new Error(`Location ${locationId} not found`);
      }

      expectedMetadata = currentLocation.metadata;
      metadataForUpdate = preserveTerritorialVisibilityMetadata(
        currentLocation.metadata,
        updates.metadata,
      );
    }

    const payload: LocationUpdate = {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.slug !== undefined ? { slug: updates.slug } : {}),
      ...(metadataForUpdate !== undefined ? { metadata: toJsonMetadata(metadataForUpdate) } : {}),
    };

    let query = this.db
      .from<LocationRow>('locations')
      .update(payload)
      .eq('id', locationId);

    // Metadata visibility is updated independently by core/territorial. The
    // optimistic metadata predicate prevents this broad JSONB update from
    // overwriting a concurrent visibility mutation performed by the Edge Function.
    if (expectedMetadata !== undefined) {
      query = query
        .eq('metadata', toJsonMetadata(expectedMetadata))
        .select('id');
    }

    const { data, error } = await query;
    if (error) throw error;

    if (expectedMetadata !== undefined && (!data || data.length === 0)) {
      throw new Error(
        `Location ${locationId} metadata changed concurrently; reload before retrying the admin update.`,
      );
    }
  }
}

export const locationAdminService = LocationAdminService;
