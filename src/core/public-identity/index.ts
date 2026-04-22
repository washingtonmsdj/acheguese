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

// Hooks
export {
  useIdentityAvailability,
  useIdentityCooldown,
  useIdentityHistory,
  useIdentityUrlPreview,
  URL_PREVIEW_FNS,
} from './hooks';
export type {
  UseIdentityAvailabilityOptions,
  UseIdentityAvailabilityReturn,
  UseIdentityCooldownOptions,
  UseIdentityCooldownReturn,
  UseIdentityHistoryOptions,
  UseIdentityHistoryReturn,
  UseIdentityUrlPreviewOptions,
  UrlPreviewFn,
} from './hooks';

// Components
export {
  IdentityField,
  IdentityAvailabilityBadge,
  IdentityUrlPreview,
  IdentityCooldownNotice,
  IdentityHistoryPanel,
  IdentityImpactNotice,
  IdentityChangeConfirmDialog,
  BusinessIdentityField,
  ProfileIdentityField,
  ProfessionalIdentityField,
} from './components';
export type { IdentityFieldProps } from './components';

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
