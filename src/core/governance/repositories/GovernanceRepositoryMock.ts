/**
 * GovernanceRepositoryMock
 * 
 * Implementação in-memory para desenvolvimento sem banco.
 */

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

export class GovernanceRepositoryMock implements IGovernanceRepository {
  private versions: LocationVersion[] = [];
  private aliases: LocationAlias[] = [];
  private redirects: SlugRedirect[] = [];
  private events: TerritoryChangeEvent[] = [];
  private postalHistory: PostalCodeHistory[] = [];

  // ============================================
  // LOCATION VERSIONS
  // ============================================

  async createLocationVersion(data: CreateLocationVersionInput): Promise<LocationVersion> {
    const existingVersions = this.versions.filter(v => v.location_id === data.location_id);
    const versionNumber = existingVersions.length + 1;

    const version: LocationVersion = {
      id: `lv-${Date.now()}`,
      location_id: data.location_id,
      version_number: versionNumber,
      name: data.name,
      full_name: data.full_name,
      slug: data.slug,
      geographic_path: data.geographic_path,
      change_type: data.change_type,
      change_reason: data.change_reason ?? null,
      official_source: data.official_source ?? null,
      official_document_url: data.official_document_url ?? null,
      valid_from: data.valid_from,
      valid_until: null,
      created_by: null,
      created_at: new Date().toISOString(),
    };

    this.versions.push(version);
    return version;
  }

  async getActiveVersionForLocation(locationId: string): Promise<LocationVersion | null> {
    const now = new Date().toISOString();
    return this.versions.find(
      v => v.location_id === locationId && 
           (v.valid_until === null || v.valid_until > now)
    ) ?? null;
  }

  async listVersionsForLocation(locationId: string): Promise<LocationVersion[]> {
    return this.versions
      .filter(v => v.location_id === locationId)
      .sort((a, b) => b.version_number - a.version_number);
  }

  // ============================================
  // LOCATION ALIASES
  // ============================================

  async createLocationAlias(data: CreateLocationAliasInput): Promise<LocationAlias> {
    // Verificar duplicata
    const exists = this.aliases.some(
      a => a.location_id === data.location_id && 
           a.alias_type === data.alias_type && 
           a.alias_value === data.alias_value
    );

    if (exists) {
      throw new Error(`Alias '${data.alias_value}' of type '${data.alias_type}' already exists for location ${data.location_id}`);
    }

    const alias: LocationAlias = {
      id: `la-${Date.now()}`,
      location_id: data.location_id,
      alias_type: data.alias_type,
      alias_value: data.alias_value,
      valid_from: data.valid_from ?? new Date().toISOString(),
      valid_until: data.valid_until ?? null,
      created_at: new Date().toISOString(),
    };

    this.aliases.push(alias);
    return alias;
  }

  async findLocationByAlias(aliasValue: string, aliasType?: string): Promise<string | null> {
    const now = new Date().toISOString();
    const alias = this.aliases.find(
      a => a.alias_value === aliasValue &&
           (!aliasType || a.alias_type === aliasType) &&
           (a.valid_until === null || a.valid_until > now)
    );

    return alias?.location_id ?? null;
  }

  async listAliasesForLocation(locationId: string): Promise<LocationAlias[]> {
    return this.aliases.filter(a => a.location_id === locationId);
  }

  // ============================================
  // SLUG REDIRECTS
  // ============================================

  async createSlugRedirect(data: CreateSlugRedirectInput): Promise<SlugRedirect> {
    // Verificar duplicata
    const exists = this.redirects.some(r => r.old_slug === data.old_slug);
    if (exists) {
      throw new Error(`Redirect for old_slug '${data.old_slug}' already exists`);
    }

    const redirect: SlugRedirect = {
      id: `sr-${Date.now()}`,
      location_id: data.location_id,
      old_slug: data.old_slug,
      new_slug: data.new_slug,
      redirect_type: data.redirect_type ?? 'permanent',
      reason: data.reason ?? null,
      created_at: new Date().toISOString(),
      expires_at: data.expires_at ?? null,
    };

    this.redirects.push(redirect);
    return redirect;
  }

  async findRedirectByOldSlug(oldSlug: string): Promise<SlugRedirect | null> {
    const now = new Date().toISOString();
    return this.redirects.find(
      r => r.old_slug === oldSlug &&
           (r.expires_at === null || r.expires_at > now)
    ) ?? null;
  }

  async listRedirectsForLocation(locationId: string): Promise<SlugRedirect[]> {
    return this.redirects.filter(r => r.location_id === locationId);
  }

  // ============================================
  // TERRITORY CHANGE EVENTS
  // ============================================

  async createTerritoryChangeEvent(data: CreateTerritoryChangeEventInput): Promise<TerritoryChangeEvent> {
    const event: TerritoryChangeEvent = {
      id: `tce-${Date.now()}`,
      location_id: data.location_id,
      event_type: data.event_type,
      old_value: data.old_value ?? null,
      new_value: data.new_value ?? null,
      official_source: data.official_source,
      official_document_url: data.official_document_url ?? null,
      effective_date: data.effective_date,
      processed_at: null,
      processed_by: null,
      created_at: new Date().toISOString(),
      metadata: data.metadata ?? {},
    };

    this.events.push(event);
    return event;
  }

  async listEventsForLocation(locationId: string): Promise<TerritoryChangeEvent[]> {
    return this.events
      .filter(e => e.location_id === locationId)
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());
  }

  // ============================================
  // POSTAL CODE HISTORY
  // ============================================

  async createPostalCodeHistory(data: CreatePostalCodeHistoryInput): Promise<PostalCodeHistory> {
    const history: PostalCodeHistory = {
      id: `pch-${Date.now()}`,
      location_id: data.location_id,
      postal_code: data.postal_code,
      street: data.street ?? null,
      valid_from: data.valid_from,
      valid_until: data.valid_until ?? null,
      source: data.source ?? 'manual',
      created_at: new Date().toISOString(),
    };

    this.postalHistory.push(history);
    return history;
  }

  async listPostalCodeHistoryForLocation(locationId: string): Promise<PostalCodeHistory[]> {
    return this.postalHistory
      .filter(p => p.location_id === locationId)
      .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime());
  }
}
