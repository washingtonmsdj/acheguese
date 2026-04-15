/**
 * Public Identity - Barrel Exports
 * Módulo de identidade pública transversal
 */

// Inicialização (registra adapters)
import './init';

// Types
export type {
  EntityType,
  EntityId,
  AvailabilityStatus,
  AvailabilityResult,
  ChangeReason,
  IdentityChangeRecord,
  CooldownResult,
  ValidationResult,
  PublicIdentity,
} from './domain/types';

// Messages
export { IDENTITY_MESSAGES } from './domain/messages';
export type { IdentityMessageKey } from './domain/messages';

// Interfaces
export type { IdentityPolicy } from './domain/IdentityPolicy';
export type { IdentityAdapter } from './domain/IdentityAdapter';

// Policies
export { BusinessIdentityPolicy } from './policies/BusinessIdentityPolicy';
export { ProfileIdentityPolicy } from './policies/ProfileIdentityPolicy';
export { ProfessionalIdentityPolicy } from './policies/ProfessionalIdentityPolicy';

// Adapters
export { BusinessIdentityAdapter } from './adapters/BusinessIdentityAdapter';
export { ProfileIdentityAdapter } from './adapters/ProfileIdentityAdapter';
export { ProfessionalIdentityAdapter } from './adapters/ProfessionalIdentityAdapter';

// Services
export { PublicIdentityService } from './services/PublicIdentityService';

// Singleton instance
import { PublicIdentityService } from './services/PublicIdentityService';
export const publicIdentityService = new PublicIdentityService();

// Utils
export {
  getReservedForEntityType,
  isReservedForEntityType,
  COMMON_RESERVED,
  BUSINESS_SPECIFIC_RESERVED,
  PROFILE_SPECIFIC_RESERVED,
  PROFESSIONAL_SPECIFIC_RESERVED,
} from './utils/reserved-names';
