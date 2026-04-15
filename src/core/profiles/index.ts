/**
 * Core Profiles Module
 *
 * Entidades canônicas de perfil do sistema.
 * Representa identidade do usuário em diferentes contextos.
 */

// Types
export type { Profile } from "./types/Profile";
export type { PublicProfile } from "./types/PublicProfile";
export type { Author } from "./types/Author";

// Mappers
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
export { useProfile } from "./hooks/useProfile";
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

