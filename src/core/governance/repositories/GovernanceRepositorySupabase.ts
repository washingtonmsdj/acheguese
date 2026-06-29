/**
 * GovernanceRepositorySupabase
 * 
 * Implementação Supabase para governança territorial e postal.
 */

import { supabase } from '@/integrations/supabase';
import type { Json, Tables, TablesInsert } from '@/integrations/supabase';
import type { IGovernanceRepository } from './IGovernanceRepository';
import type {
  LocationVersion,
  CreateLocationVersionInput,
  LocationAlias,
  CreateLocationAliasInput,
  TerritoryChangeEvent,
  CreateTerritoryChangeEventInput,
  PostalCodeHistory,
  CreatePostalCodeHistoryInput,
} from '../types';

type ErrorLike = {
  message?: string | null;
};

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  eq(column: string, value: unknown): TableClient<TRow>;
  insert(values: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  or(filters: string): TableClient<TRow>;
  order(column: string, options?: { ascending?: boolean }): TableClient<TRow>;
  select(columns?: string): TableClient<TRow>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type GovernanceDbClient = {
  from<TRow>(table: string): TableClient<TRow>;
};

type LocationVersionRow = Tables<'location_versions'>;
type LocationVersionInsert = TablesInsert<'location_versions'>;
type LocationAliasRow = Tables<'location_aliases'>;
type LocationAliasInsert = TablesInsert<'location_aliases'>;
type TerritoryChangeEventRow = Tables<'territory_change_events'>;
type TerritoryChangeEventInsert = TablesInsert<'territory_change_events'>;
type PostalCodeHistoryRow = Tables<'postal_code_history'>;
type PostalCodeHistoryInsert = TablesInsert<'postal_code_history'>;

const governanceDb = supabase as unknown as GovernanceDbClient;

function toJsonMetadata(value: Record<string, unknown>): Json {
  return value as Json;
}

export class GovernanceRepositorySupabase implements IGovernanceRepository {
  private readonly db = governanceDb;
  // ============================================
  // LOCATION VERSIONS
  // ============================================

  async createLocationVersion(data: CreateLocationVersionInput): Promise<LocationVersion> {
    // Buscar próximo version_number
    const { data: versions, error: countError } = await this.db
      .from<LocationVersionRow>('location_versions')
      .select('version_number')
      .eq('location_id', data.location_id)
      .order('version_number', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const payload: LocationVersionInsert = {
      change_reason: data.change_reason,
      change_type: data.change_type,
      full_name: data.full_name,
      geographic_path: data.geographic_path,
      location_id: data.location_id,
      name: data.name,
      official_document_url: data.official_document_url,
      official_source: data.official_source,
      slug: data.slug,
      valid_from: data.valid_from,
      version_number: nextVersion,
    };

    const { data: version, error } = await this.db
      .from<LocationVersionRow>('location_versions')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return version as LocationVersion;
  }

  async getActiveVersionForLocation(locationId: string): Promise<LocationVersion | null> {
    const { data, error } = await this.db
      .from<LocationVersionRow>('location_versions')
      .select('*')
      .eq('location_id', locationId)
      .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data as LocationVersion | null) ?? null;
  }

  async listVersionsForLocation(locationId: string): Promise<LocationVersion[]> {
    const { data, error } = await this.db
      .from<LocationVersionRow>('location_versions')
      .select('*')
      .eq('location_id', locationId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return (data as LocationVersion[]) ?? [];
  }

  // ============================================
  // LOCATION ALIASES
  // ============================================

  async createLocationAlias(data: CreateLocationAliasInput): Promise<LocationAlias> {
    const { data: alias, error } = await this.db
      .from<LocationAliasRow>('location_aliases')
      .insert({
        alias_type: data.alias_type,
        alias_value: data.alias_value,
        location_id: data.location_id,
        valid_from: data.valid_from ?? new Date().toISOString(),
        valid_until: data.valid_until,
      } satisfies LocationAliasInsert)
      .select()
      .single();

    if (error) throw error;
    return alias as LocationAlias;
  }

  async findLocationByAlias(aliasValue: string, aliasType?: string): Promise<string | null> {
    let query = this.db
      .from<LocationAliasRow>('location_aliases')
      .select('location_id')
      .eq('alias_value', aliasValue)
      .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString());

    if (aliasType) {
      query = query.eq('alias_type', aliasType);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) throw error;
    return data?.location_id ?? null;
  }

  async listAliasesForLocation(locationId: string): Promise<LocationAlias[]> {
    const { data, error } = await this.db
      .from<LocationAliasRow>('location_aliases')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as LocationAlias[]) ?? [];
  }

  // ============================================
  // TERRITORY CHANGE EVENTS
  // ============================================

  async createTerritoryChangeEvent(data: CreateTerritoryChangeEventInput): Promise<TerritoryChangeEvent> {
    const { data: event, error } = await this.db
      .from<TerritoryChangeEventRow>('territory_change_events')
      .insert({
        effective_date: data.effective_date,
        event_type: data.event_type,
        location_id: data.location_id,
        metadata: toJsonMetadata(data.metadata ?? {}),
        new_value: data.new_value,
        official_document_url: data.official_document_url,
        official_source: data.official_source,
        old_value: data.old_value,
      } satisfies TerritoryChangeEventInsert)
      .select()
      .single();

    if (error) throw error;
    return event as TerritoryChangeEvent;
  }

  async listEventsForLocation(locationId: string): Promise<TerritoryChangeEvent[]> {
    const { data, error } = await this.db
      .from<TerritoryChangeEventRow>('territory_change_events')
      .select('*')
      .eq('location_id', locationId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return (data as TerritoryChangeEvent[]) ?? [];
  }

  // ============================================
  // POSTAL CODE HISTORY
  // ============================================

  async createPostalCodeHistory(data: CreatePostalCodeHistoryInput): Promise<PostalCodeHistory> {
    const { data: history, error } = await this.db
      .from<PostalCodeHistoryRow>('postal_code_history')
      .insert({
        location_id: data.location_id,
        postal_code: data.postal_code,
        source: data.source ?? 'manual',
        street: data.street,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
      } satisfies PostalCodeHistoryInsert)
      .select()
      .single();

    if (error) throw error;
    return history as PostalCodeHistory;
  }

  async listPostalCodeHistoryForLocation(locationId: string): Promise<PostalCodeHistory[]> {
    const { data, error } = await this.db
      .from<PostalCodeHistoryRow>('postal_code_history')
      .select('*')
      .eq('location_id', locationId)
      .order('valid_from', { ascending: false });

    if (error) throw error;
    return (data as PostalCodeHistory[]) ?? [];
  }
}
