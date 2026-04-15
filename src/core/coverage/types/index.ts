/**
 * Coverage Module - Public Contracts
 * 
 * Sistema de cobertura de entidades.
 * Etapa 2: Contratos Públicos
 */

import type { LocationType } from '@/core/location/types';

// ============================================
// ENUMS
// ============================================

export enum CoverageType {
  DISTRICT = 'district',
  CITY = 'city',
  RADIUS = 'radius',
}

export enum CoverageStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// OWNERSHIP CANÔNICO
// ============================================

/**
 * DECISÃO FECHADA: Ownership de Coverage
 * 
 * - entity_type: tipo da entidade
 * - entity_id: ID da entidade
 * 
 * Não usar colunas genéricas como "owner_id" ou "profile_id".
 * Cada módulo de domínio passa seu tipo + ID.
 */

export type EntityType = 
  | 'business'
  | 'service_provider'
  | 'classified'
  | 'mobility_driver'
  | 'ad_campaign';

// ============================================
// CORE TYPES
// ============================================

export interface ServiceArea {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  coverage_type: CoverageType;
  location_id: string;
  radius_km: number | null;
  is_primary: boolean;
  status: CoverageStatus;
  created_at: string;
  updated_at: string;
}

export interface CoverageWithLocation {
  coverage: ServiceArea;
  location_name: string;
  location_path: string;
  location_type: LocationType;
}

// ============================================
// INPUT TYPES
// ============================================

export interface SetCoverageInput {
  entity_type: EntityType;
  entity_id: string;
  coverages: CoverageDefinition[];
}

export interface CoverageDefinition {
  coverage_type: CoverageType;
  location_id: string;
  radius_km?: number;
  is_primary?: boolean;
}

export interface GetCoverageInput {
  entity_type: EntityType;
  entity_id: string;
  status?: CoverageStatus;
}

export interface DoesCoverInput {
  entity_type: EntityType;
  entity_id: string;
  location_id: string;
}

export interface GetEntitiesCoveringInput {
  entity_type: EntityType;  // obrigatório
  location_id: string;
  status?: CoverageStatus;
  page?: number;
  page_size?: number;
}

export interface RemoveCoverageInput {
  entity_type: EntityType;
  entity_id: string;
  coverage_id?: string;
}

export interface UpdateCoverageStatusInput {
  coverage_id: string;
  status: CoverageStatus;
}

export interface GetPrimaryCoverageInput {
  entity_type: EntityType;
  entity_id: string;
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface SetCoverageOutput {
  coverages: ServiceArea[];
  count: number;
}

export interface GetCoverageOutput {
  coverages: CoverageWithLocation[];
  count: number;
}

export interface DoesCoverOutput {
  covers: boolean;
  coverage: ServiceArea | null;
  reason: string | null;
}

export interface GetEntitiesCoveringOutput {
  entity_ids: string[];
  entity_type: EntityType;  // eco do input
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface RemoveCoverageOutput {
  removed_count: number;
}

export interface GetPrimaryCoverageOutput {
  coverage: CoverageWithLocation | null;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidateCoverageInput {
  coverage_type: CoverageType;
  location_id: string;
  radius_km?: number;
}

export interface ValidateCoverageOutput {
  is_valid: boolean;
  validation_errors: string[];
}

// ============================================
// ERROR TYPES
// ============================================

export enum CoverageErrorCode {
  COVERAGE_NOT_FOUND = 'COVERAGE_NOT_FOUND',
  INVALID_ENTITY_TYPE = 'INVALID_ENTITY_TYPE',
  INVALID_ENTITY_ID = 'INVALID_ENTITY_ID',
  INVALID_COVERAGE_TYPE = 'INVALID_COVERAGE_TYPE',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  INVALID_RADIUS = 'INVALID_RADIUS',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  LOCATION_INACTIVE = 'LOCATION_INACTIVE',
  DUPLICATE_COVERAGE = 'DUPLICATE_COVERAGE',
  PRIMARY_COVERAGE_REQUIRED = 'PRIMARY_COVERAGE_REQUIRED',
  MULTIPLE_PRIMARY_COVERAGE = 'MULTIPLE_PRIMARY_COVERAGE',
  RADIUS_REQUIRED = 'RADIUS_REQUIRED',
  RADIUS_NOT_ALLOWED = 'RADIUS_NOT_ALLOWED',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface CoverageError {
  code: CoverageErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// VALIDATION RULES
// ============================================

export const COVERAGE_VALIDATION = {
  MIN_RADIUS_KM: 1,
  MAX_RADIUS_KM: 100,
  DEFAULT_RADIUS_KM: 10,
  MAX_COVERAGES_PER_ENTITY: 50,
} as const;

// ============================================
// PAGINATION RULES
// ============================================

export const COVERAGE_PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_PAGE: 1,
} as const;
