/**
 * Governance Types - Tipos para governança territorial e postal
 */

// ============================================
// LOCATION VERSION
// ============================================

export type LocationChangeType = 
  | 'name_change'
  | 'slug_change'
  | 'boundary_change'
  | 'creation'
  | 'merge'
  | 'split'
  | 'other';

export interface LocationVersion {
  id: string;
  location_id: string;
  version_number: number;
  name: string;
  full_name: string;
  slug: string;
  geographic_path: string;
  change_type: LocationChangeType;
  change_reason: string | null;
  official_source: string | null;
  official_document_url: string | null;
  valid_from: string;
  valid_until: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateLocationVersionInput {
  location_id: string;
  name: string;
  full_name: string;
  slug: string;
  geographic_path: string;
  change_type: LocationChangeType;
  change_reason?: string;
  official_source?: string;
  official_document_url?: string;
  valid_from: string;
}

// ============================================
// LOCATION ALIAS
// ============================================

export type LocationAliasType = 
  | 'historical_name'
  | 'popular_name'
  | 'abbreviation'
  | 'old_slug'
  | 'other';

export interface LocationAlias {
  id: string;
  location_id: string;
  alias_type: LocationAliasType;
  alias_value: string;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export interface CreateLocationAliasInput {
  location_id: string;
  alias_type: LocationAliasType;
  alias_value: string;
  valid_from?: string;
  valid_until?: string | null;
}

// ============================================
// SLUG REDIRECT
// ============================================

export type SlugRedirectType = 'permanent' | 'temporary';

export interface SlugRedirect {
  id: string;
  location_id: string;
  old_slug: string;
  new_slug: string;
  redirect_type: SlugRedirectType;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface CreateSlugRedirectInput {
  location_id: string;
  old_slug: string;
  new_slug: string;
  redirect_type?: SlugRedirectType;
  reason?: string;
  expires_at?: string | null;
}

// ============================================
// TERRITORY CHANGE EVENT
// ============================================

export type TerritoryChangeEventType = 
  | 'name_change'
  | 'slug_change'
  | 'boundary_change'
  | 'parent_change'
  | 'status_change'
  | 'merge'
  | 'split'
  | 'creation'
  | 'deactivation'
  | 'other';

export interface TerritoryChangeEvent {
  id: string;
  location_id: string;
  event_type: TerritoryChangeEventType;
  old_value: string | null;
  new_value: string | null;
  official_source: string;
  official_document_url: string | null;
  effective_date: string;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface CreateTerritoryChangeEventInput {
  location_id: string;
  event_type: TerritoryChangeEventType;
  old_value?: string | null;
  new_value?: string | null;
  official_source: string;
  official_document_url?: string;
  effective_date: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// POSTAL CODE HISTORY
// ============================================

export type PostalCodeSource = 'correios' | 'ibge' | 'prefeitura' | 'manual' | 'other';

export interface PostalCodeHistory {
  id: string;
  location_id: string;
  postal_code: string;
  street: string | null;
  valid_from: string;
  valid_until: string | null;
  source: PostalCodeSource;
  created_at: string;
}

export interface CreatePostalCodeHistoryInput {
  location_id: string;
  postal_code: string;
  street?: string | null;
  valid_from: string;
  valid_until?: string | null;
  source?: PostalCodeSource;
}
