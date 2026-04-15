/**
 * Rollout Module - Public Contracts
 * 
 * Sistema de ativação de módulos por localização.
 * Etapa 2: Contratos Públicos
 */

// ============================================
// ENUMS
// ============================================

export enum ModuleKey {
  COMMUNITY = 'community',
  BUSINESS = 'business',
  SERVICES = 'services',
  MOBILITY = 'mobility',
  CLASSIFIEDS = 'classifieds',
  PROMOTIONS = 'promotions',
  GASTRONOMY = 'gastronomy',
  EVENTS = 'events',
  JOBS = 'jobs',
}

export enum RolloutStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// ============================================
// CORE TYPES
// ============================================

export interface ModuleRollout {
  id: string;
  module_key: ModuleKey;
  location_id: string;
  status: RolloutStatus;
  config: ModuleConfig | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleConfig {
  [key: string]: unknown;
}

export interface EffectiveRollout {
  module_key: ModuleKey;
  location_id: string;
  status: RolloutStatus;
  config: ModuleConfig | null;
  source: RolloutSource;
  inherited_from: string | null;
}

export enum RolloutSource {
  LOCAL = 'local',
  INHERITED = 'inherited',
  DEFAULT = 'default',
}

// ============================================
// INPUT TYPES
// ============================================

export interface IsModuleActiveInput {
  module_key: ModuleKey;
  location_id: string;
}

export interface GetEffectiveRolloutInput {
  module_key: ModuleKey;
  location_id: string;
}

export interface GetActiveModulesInput {
  location_id: string;
}

export interface GetLocationsForModuleInput {
  module_key: ModuleKey;
  status?: RolloutStatus;
  page?: number;
  page_size?: number;
}

export interface SetModuleRolloutInput {
  module_key: ModuleKey;
  location_id: string;
  status: RolloutStatus;
  config?: ModuleConfig;
}

export interface RemoveModuleRolloutInput {
  module_key: ModuleKey;
  location_id: string;
}

export interface GetModuleConfigInput {
  module_key: ModuleKey;
  location_id: string;
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface IsModuleActiveOutput {
  is_active: boolean;
  effective_rollout: EffectiveRollout;
}

export interface GetEffectiveRolloutOutput {
  effective_rollout: EffectiveRollout;
}

export interface GetActiveModulesOutput {
  modules: EffectiveRollout[];
  count: number;
}

export interface GetLocationsForModuleOutput {
  location_ids: string[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface SetModuleRolloutOutput {
  rollout: ModuleRollout;
}

export interface GetModuleConfigOutput {
  config: ModuleConfig | null;
  source: RolloutSource;
}

// ============================================
// HERANÇA E OVERRIDE
// ============================================

/**
 * CONTRATO DE HERANÇA:
 * 
 * 1. Se localização tem rollout explícito: usa ele (LOCAL)
 * 2. Se não, busca no parent recursivamente (INHERITED)
 * 3. Se nenhum ancestor tem: usa default false (DEFAULT)
 * 
 * OVERRIDE LOCAL:
 * - Localização pode sobrescrever herança criando rollout explícito
 * - Override afeta apenas a localização, não os filhos
 * - Filhos continuam herdando do parent mais próximo
 * 
 * EXEMPLO:
 * 
 * Brasil (active)
 *   └─ Bahia (sem override) → herda active
 *       └─ Salvador (inactive override) → inactive
 *           └─ Pituba (sem override) → herda inactive de Salvador
 */

// ============================================
// ERROR TYPES
// ============================================

export enum RolloutErrorCode {
  ROLLOUT_NOT_FOUND = 'ROLLOUT_NOT_FOUND',
  INVALID_MODULE_KEY = 'INVALID_MODULE_KEY',
  INVALID_LOCATION_ID = 'INVALID_LOCATION_ID',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  LOCATION_INACTIVE = 'LOCATION_INACTIVE',
  INVALID_CONFIG = 'INVALID_CONFIG',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface RolloutError {
  code: RolloutErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// PAGINATION RULES
// ============================================

export const ROLLOUT_PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEFAULT_PAGE: 1,
} as const;
