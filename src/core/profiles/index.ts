/**
 * Core Profiles Module
 *
 * Entidades canônicas de perfil do sistema.
 * Representa identidade do usuário em diferentes contextos.
 * 
 * ARQUITETURA SSOT v2.0:
 * - domain/: Entidades canônicas (Profile, ProfileType, ProfileStatus, etc.)
 * - persistence/: Row types do banco (ProfileRow) e mappers
 * - views/: Read models (ProfileSummary, Author, PublicProfile, ProfileContext)
 * - operations/: Inputs/outputs (CreateProfileInput, UpdateProfileInput, ProfileFilters)
 * - legacy/: Compatibilidade temporária (LegacyProfile) - será removido
 * - services/: Lógica de negócio (ProfileService) - NÃO redefine entidades
 */

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN — Entidades Canônicas
// ══════════════════════════════════════════════════════════════════════════

export type { Profile } from './domain/Profile';
export { createDefaultProfile, isProfile } from './domain/Profile';
export type { ProfileType } from './domain/ProfileType';
/**
 * @deprecated Use ProfileModerationState — ProfileStatus foi renomeado para evitar colisão
 * com ProfileStatus de core/authorization.
 */
export type { ProfileModerationState } from './domain/ProfileModerationState';
export {
  createActiveModerationState,
  createSuspendedModerationState,
  createBlockedModerationState,
  canPerformActions,
  isSuspensionExpired,
} from './domain/ProfileModerationState';
export type {
  BusinessData,
  ProfessionalData,
  DriverData,
} from './domain/ProfileExtensions';

// ══════════════════════════════════════════════════════════════════════════
// PERSISTENCE — Row Types e Mappers
// ══════════════════════════════════════════════════════════════════════════

export type { ProfileRow, ProfileInsert, ProfileUpdate } from './persistence/ProfileRow';
export {
  rowToDomain,
  rowsToDomain,
  domainToInsert,
  domainToInsertWithSnapshots,
  domainToUpdate,
  ProfileRowMapper,
} from './persistence/ProfileRowMapper';

// ══════════════════════════════════════════════════════════════════════════
// VIEWS — Read Models
// ══════════════════════════════════════════════════════════════════════════

export type { ProfileSummary, ProfileSummaryExtended } from './views/ProfileSummary';
export { createProfileSummary } from './views/ProfileSummary';
export type { Author, AuthorExtended } from './views/Author';
export { createAuthor } from './views/Author';
export type { PublicProfile, PublicProfileExtended } from './views/PublicProfile';
export { createPublicProfile } from './views/PublicProfile';
export type {
  ProfileContext,
  PlanType,
  ProfilePlan,
  ProfileReputation,
} from './views/ProfileContext';
export { createDefaultProfileContext } from './views/ProfileContext';

// View models específicos por contexto
export type { SessionProfileView } from './views/SessionProfileView';
export type { MentionableProfileView } from './views/MentionableProfileView';
export type { DirectMessageRecipientView } from './views/DirectMessageRecipientView';
export type { ProfileAccountSnapshot } from './views/ProfileAccountSnapshot';
export type {
  ProfileLikeActivityRecord,
  ProfileSaveActivityRecord,
  ProfilePollVoteActivityRecord,
} from './views/ProfileActivityRecords';

// Contratos de runtime (compartilhados entre services, views e admin)
export type {
  PlanType,
  ProfilePlan,
  ProfileStatus,
  ProfilePermissions,
  ProfileReputation,
} from './contracts/ProfileRuntimeContracts';

// Tipos de negócios associados ao perfil
export type {
  ProfileAssociatedBusiness,
  ProfileBusinessModuleSnapshot,
} from './services/ProfileBusinessTypes';

// Tipos de operação e estatísticas
export type {
  ProfileActivityStats,
  ProfilePrivacySettingsInput,
} from './services/ProfileOperationTypes';

// ProfilePermissionsView (movido de domain/ para views/)
export type { ProfilePermissionsView } from './views/ProfilePermissionsView';
export {
  createDefaultPermissionsView,
  createRestrictedPermissionsView,
  createModeratorPermissionsView,
} from './views/ProfilePermissionsView';

// ══════════════════════════════════════════════════════════════════════════
// OPERATIONS — Inputs/Outputs
// ══════════════════════════════════════════════════════════════════════════

export type {
  CreateProfileInput,
  CreateProfileWithExtensionInput,
} from './operations/CreateProfileInput';
export { validateCreateProfileInput } from './operations/CreateProfileInput';
export type {
  UpdateProfileInput,
  UpdateProfileAdminInput,
} from './operations/UpdateProfileInput';
export { validateUpdateProfileInput } from './operations/UpdateProfileInput';
export type {
  ProfileFilters,
  AdminProfileFilters,
  ProfileSearchFilters,
} from './operations/ProfileFilters';
export { createDefaultFilters } from './operations/ProfileFilters';

// ══════════════════════════════════════════════════════════════════════════
// LEGACY — Compatibilidade Temporária (será removido)
// ══════════════════════════════════════════════════════════════════════════

export type {
  LegacyProfile,
  LegacyProfileType,
  LegacyCreateProfileData,
  LegacyUpdateProfileData,
} from './legacy/LegacyProfile';
export {
  toLegacyProfile,
  fromLegacyProfile,
  fromLegacyUpdateData,
} from './legacy/LegacyMapper';

// ══════════════════════════════════════════════════════════════════════════
// SERVICES — Lógica de Negócio
// ══════════════════════════════════════════════════════════════════════════

// Mappers (legado - manter por compatibilidade)
export {
  toCanonicalProfile,
  toCanonicalProfiles,
  type CanonicalProfile,
} from "./mappers";

// Services
export { profileService, ProfileService } from "./services/ProfileService";
export {
  profileMobilityAdapter,
  ProfileMobilityAdapter,
} from "./services/ProfileMobilityAdapter";
export {
  ProfileVerificationAdminService,
  profileVerificationAdminService,
} from "./services/ProfileVerificationAdminService";
export type {
  ProfileType,
  CreateProfileData,
  UpdateProfileData,
  ProfileContext,
  ProfileStatus,
  ProfilePermissions,
  ProfilePlan,
  ProfileReputation,
  PlanType,
  ProfileSummary,
  ProfileSummaryExtended,
  AdminProfileListItem,
  AdminFilters,
  BasePermissions,
  ProfileStats,
  Business,
  ProfilePrivateWorkspace,
  ProfileIdentitySnapshot,
  ProfileOperationsCounts,
  ProfileManagedAssetItem,
  ProfileNotificationsSnapshot,
  ProfileNotificationItem,
  ProfileAccountSnapshot,
  ProfileEffectivePermission,
  ProfileVerificationStatusValue,
} from "./services/types";
export { ProfileError } from "./services/types";
export type {
  PendingVerification,
  VerificationStats,
} from "./services/ProfileVerificationAdminService";

// Hooks
// useProfile foi removido na Fase 4 — use useSessionContext de @/core/session
export { usePrivateProfileWorkspace } from "./hooks/usePrivateProfileWorkspace";
export { useProfileEditor } from "./hooks/useProfileEditor";

// Components
export { ProfileSwitcher } from "./components/ProfileSwitcher";

// Multi-profile context & hooks
export { MultiProfileProvider, ModuleContextSync, useMultiProfileContext } from './contexts/multi-profile-runtime-context.tsx';
export type { MultiProfileContextValue } from './contexts/multi-profile-runtime-context.tsx';
export { useModuleProfile } from './hooks/useModuleProfile';
export type { UseModuleProfileResult, ModuleProfileState } from './hooks/useModuleProfile';

// Multi-profile UI components
export { ActiveProfileBadge } from './components/ActiveProfileBadge';
export { ModuleProfileGate } from './components/ModuleProfileGate';
export { buildProfileEditUrl, buildPublicProfileUrl } from "./utils/publicProfileUrl";

