// @ts-nocheck
/**
 * GovernanceRepositorySupabase
 * 
 * Implementação Supabase para governança territorial e postal.
 */

import { supabase } from '@/integrations/supabase';
import type { IGovernanceRepository } from './IGovernanceRepository';
import type {
  LocationVersion,
  CreateLocationVersionInput,
  LocationAlias,
  CreateLocationAliasInput,
  SlugRedirect,
  CreateSlugRedirectInput,
  TerritoryChangeEvent,
  CreateTerritoryChangeEventInput,
  PostalCodeHistory,
  CreatePostalCodeHistoryInput,
} from '../types';

export class GovernanceRepositorySupabase implements IGovernanceRepository {
  // ============================================
  // LOCATION VERSIONS
  // ============================================

  async createLocationVersion(data: CreateLocationVersionInput): Promise<LocationVersion> {
    // Buscar próximo version_number
    const { data: versions, error: countError } = await supabase
      .from('location_versions')
      .select('version_number')
      .eq('location_id', data.location_id)
      .order('version_number', { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { data: version, error } = await supabase
      .from('location_versions')
      .insert({
        location_id: data.location_id,
        version_number: nextVersion,
        name: data.name,
        full_name: data.full_name,
        slug: data.slug,
        geographic_path: data.geographic_path,
        change_type: data.change_type,
        change_reason: data.change_reason,
        official_source: data.official_source,
        official_document_url: data.official_document_url,
        valid_from: data.valid_from,
      })
      .select()
      .single();

    if (error) throw error;
    return version;
  }

  async getActiveVersionForLocation(locationId: string): Promise<LocationVersion | null> {
    const { data, error } = await supabase
      .from('location_versions')
      .select('*')
      .eq('location_id', locationId)
      .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async listVersionsForLocation(locationId: string): Promise<LocationVersion[]> {
    const { data, error } = await supabase
      .from('location_versions')
      .select('*')
      .eq('location_id', locationId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // ============================================
  // LOCATION ALIASES
  // ============================================

  async createLocationAlias(data: CreateLocationAliasInput): Promise<LocationAlias> {
    const { data: alias, error } = await supabase
      .from('location_aliases')
      .insert({
        location_id: data.location_id,
        alias_type: data.alias_type,
        alias_value: data.alias_value,
        valid_from: data.valid_from ?? new Date().toISOString(),
        valid_until: data.valid_until,
      })
      .select()
      .single();

    if (error) throw error;
    return alias;
  }

  async findLocationByAlias(aliasValue: string, aliasType?: string): Promise<string | null> {
    let query = supabase
      .from('location_aliases')
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
    const { data, error } = await supabase
      .from('location_aliases')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // ============================================
  // SLUG REDIRECTS
  // ============================================

  async createSlugRedirect(data: CreateSlugRedirectInput): Promise<SlugRedirect> {
    const { data: redirect, error } = await supabase
      .from('slug_redirects')
      .insert({
        location_id: data.location_id,
        old_slug: data.old_slug,
        new_slug: data.new_slug,
        redirect_type: data.redirect_type ?? 'permanent',
        reason: data.reason,
        expires_at: data.expires_at,
      })
      .select()
      .single();

    if (error) throw error;
    return redirect;
  }

  async findRedirectByOldSlug(oldSlug: string): Promise<SlugRedirect | null> {
    const { data, error } = await supabase
      .from('slug_redirects')
      .select('*')
      .eq('old_slug', oldSlug)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async listRedirectsForLocation(locationId: string): Promise<SlugRedirect[]> {
    const { data, error } = await supabase
      .from('slug_redirects')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // ============================================
  // TERRITORY CHANGE EVENTS
  // ============================================

  async createTerritoryChangeEvent(data: CreateTerritoryChangeEventInput): Promise<TerritoryChangeEvent> {
    const { data: event, error } = await supabase
      .from('territory_change_events')
      .insert({
        location_id: data.location_id,
        event_type: data.event_type,
        old_value: data.old_value,
        new_value: data.new_value,
        official_source: data.official_source,
        official_document_url: data.official_document_url,
        effective_date: data.effective_date,
        metadata: data.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return event;
  }

  async listEventsForLocation(locationId: string): Promise<TerritoryChangeEvent[]> {
    const { data, error } = await supabase
      .from('territory_change_events')
      .select('*')
      .eq('location_id', locationId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // ============================================
  // POSTAL CODE HISTORY
  // ============================================

  async createPostalCodeHistory(data: CreatePostalCodeHistoryInput): Promise<PostalCodeHistory> {
    const { data: history, error } = await supabase
      .from('postal_code_history')
      .insert({
        location_id: data.location_id,
        postal_code: data.postal_code,
        street: data.street,
        valid_from: data.valid_from,
        valid_until: data.valid_until,
        source: data.source ?? 'manual',
      })
      .select()
      .single();

    if (error) throw error;
    return history;
  }

  async listPostalCodeHistoryForLocation(locationId: string): Promise<PostalCodeHistory[]> {
    const { data, error } = await supabase
      .from('postal_code_history')
      .select('*')
      .eq('location_id', locationId)
      .order('valid_from', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }
}
