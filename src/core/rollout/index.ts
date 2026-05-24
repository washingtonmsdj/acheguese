/**
 * Rollout Module
 * 
 * Sistema transversal que controla a ativação de módulos do produto por localização geográfica.
 * 
 * Responsabilidades:
 * - Ativação de módulo por localização
 * - Herança de ativação
 * - Override local
 * - Config opcional por módulo/localização
 * 
 * @see docs/GEOGRAPHIC_FOUNDATION.md
 * @see docs/GEOGRAPHIC_FOUNDATION_STAGE2_CONTRACTS.md
 */

// ============================================
// PUBLIC CONTRACTS (Etapa 2)
// ============================================
export type {
  ModuleRollout,
  ModuleKey,
  RolloutStatus,
  RolloutSource,
  EffectiveRollout,
  ModuleConfig,
  RolloutError,
  IsModuleActiveInput,
  GetEffectiveRolloutInput,
  GetActiveModulesInput,
  GetLocationsForModuleInput,
  SetModuleRolloutInput,
  RemoveModuleRolloutInput,
  GetModuleConfigInput,
  IsModuleActiveOutput,
  GetEffectiveRolloutOutput,
  GetActiveModulesOutput,
  GetLocationsForModuleOutput,
  SetModuleRolloutOutput,
  GetModuleConfigOutput,
} from './types';

export { RolloutErrorCode, ROLLOUT_PAGINATION } from './types';

export type { IRolloutService } from './services/IRolloutService';
export type { IRolloutRepository } from './repositories/IRolloutRepository';

export { RolloutRepositorySupabase } from './repositories/RolloutRepositorySupabase';
export { createRolloutRepository } from './repositories/createRolloutRepository';
