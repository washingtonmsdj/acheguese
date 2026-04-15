/**
 * Location Module - Public Contracts
 * 
 * SSOT territorial do produto.
 * Etapa 2: Contratos Públicos (Revisado V2)
 */

// ============================================
// ENUMS
// ============================================

export enum LocationType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  DISTRICT = 'district',
}

export enum LocationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// CORE TYPES
// ============================================

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

// ============================================
// INPUT TYPES
// ============================================

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

// ============================================
// OUTPUT TYPES
// ============================================

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

// ============================================
// TERRITORIAL GROUP TYPES
// ============================================

export type TerritorialGroupStatus = 'active' | 'inactive';

export interface TerritorialGroup {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Cidade âncora — facilitador operacional, não hierarquia */
  anchor_city_id: string;
  status: TerritorialGroupStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TerritorialGroupMember {
  group_id: string;
  location_id: string;
  created_at: string;
}

export interface TerritorialGroupWithMembers extends TerritorialGroup {
  members: Location[];
}

// ============================================
// ACTIVE TERRITORY
// ============================================

export type ActiveTerritory = { type: 'location'; location: Location } | null;

// ============================================
// TERRITORY MODE
// ============================================
// 'bairro' = conteúdo filtrado apenas pelo bairro do usuário
// 'cidade' = conteúdo da cidade inteira com filtros por bairro
// null     = visitante sem modo (apenas cidade com filtros públicos)

export type TerritoryMode = 'bairro' | 'cidade' | null;

// ============================================
// TERRITORY FILTER — Contrato único de filtro territorial
//
// Todos os módulos que filtram dados por território devem usar este tipo.
// Nunca construir filtros ad-hoc em componentes ou hooks de módulo.
//
// scope: 'location' → eq(location_id, id)   — bairro único
// scope: 'group'    → in(location_id, ids)  — grupo de bairros
// scope: 'none'     → sem filtro territorial (território não resolvido)
// ============================================

export type TerritoryFilter =
  | { scope: 'location'; location_id: string }
  | { scope: 'group'; location_ids: string[] }
  | { scope: 'none' };

// ============================================
// CONTEXT TYPES
// ============================================

export interface LocationContextValue {
  activeTerritory: ActiveTerritory;
  activeLocation: Location | null;
  setActiveLocation: (location: Location | null) => void;
  clearActiveTerritory: () => void;
  isLoading: boolean;
  error: LocationError | null;
}

// ============================================
// ERROR TYPES
// ============================================

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

// ============================================
// PAGINATION RULES
// ============================================

export const LOCATION_PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_PAGE: 1,
  MAX_DEPTH: 10,
} as const;
