/**
 * Location Module - Public Contracts
 *
 * Canonical contracts for the geographic hierarchy.
 */

// Compatibility re-export only. Territorial group ownership remains in
// core/territorial; location consumers must not define a second group model.
export type {
  TerritorialGroupStatus,
  TerritorialGroup,
  TerritorialGroupMember,
  TerritorialGroupWithMembers,
} from '@/core/territorial/contracts';

export enum LocationType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  DISTRICT = 'district',
  NEIGHBORHOOD = 'neighborhood',
}

export enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Location {
  id: string;
  parent_id: string | null;
  type: LocationType;
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  status: LocationStatus;
  metadata: LocationMetadata;
  created_at: string;
  updated_at: string;
}

export interface LocationMetadata {
  country_code?: string;
  state_code?: string;
  timezone?: string;
  locale?: string;
  population?: number;
  [key: string]: unknown;
}

export interface LocationTree {
  location: Location;
  children: LocationTree[];
  depth: number;
}

export interface GetLocationByIdInput {
  id: string;
}

export interface GetLocationByPathInput {
  path: string;
}

export interface GetLocationBySlugWithinParentInput {
  slug: string;
  parent_id: string;
}

export interface GetAncestorsInput {
  location_id: string;
  include_self?: boolean;
}

export interface GetDescendantsInput {
  location_id: string;
  include_self?: boolean;
  max_depth?: number;
  page?: number;
  page_size?: number;
}

export interface GetChildrenInput {
  location_id: string;
  type?: LocationType;
  status?: LocationStatus;
  page?: number;
  page_size?: number;
}

export interface ValidateLocationInput {
  location_id: string;
  required_status?: LocationStatus;
  required_type?: LocationType;
}

export interface GetLocationOutput {
  location: Location;
}

export interface GetAncestorsOutput {
  ancestors: Location[];
  count: number;
}

export interface GetDescendantsOutput {
  descendants: Location[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface GetChildrenOutput {
  children: Location[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ValidateLocationOutput {
  is_valid: boolean;
  location: Location | null;
  validation_errors: string[];
}

export interface GetLocationTreeOutput {
  tree: LocationTree;
  total_nodes: number;
}

export type ActiveTerritory = { type: 'location'; location: Location } | null;

export type TerritoryMode = 'bairro' | 'cidade' | null;

export type TerritoryFilter =
  | { scope: 'location'; location_id: string }
  | { scope: 'group'; location_ids: string[] }
  | { scope: 'none' };

export interface LocationContextValue {
  activeTerritory: ActiveTerritory;
  activeLocation: Location | null;
  setActiveLocation: (location: Location | null) => void;
  clearActiveTerritory: () => void;
  isLoading: boolean;
  error: LocationError | null;
}

export enum LocationErrorCode {
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_SLUG = 'INVALID_SLUG',
  LOCATION_INACTIVE = 'LOCATION_INACTIVE',
  INVALID_TYPE = 'INVALID_TYPE',
  PARENT_NOT_FOUND = 'PARENT_NOT_FOUND',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  INVALID_HIERARCHY = 'INVALID_HIERARCHY',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface LocationError {
  code: LocationErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export const LOCATION_PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_PAGE: 1,
  MAX_DEPTH: 10,
} as const;
