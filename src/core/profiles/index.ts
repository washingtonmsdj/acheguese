export type { Profile } from './domain/Profile';
export { createDefaultProfile, isProfile } from './domain/Profile';
export type { ProfileType } from './domain/ProfileType';

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

export type { ProfileRow, ProfileInsert, ProfileUpdate } from './persistence/ProfileRow';
export {
  rowToDomain,
  rowsToDomain,
  domainToInsert,
  domainToInsertWithSnapshots,
  domainToUpdate,
} from './persistence/ProfileRowMapper';

export type { ProfileSummary, ProfileSummaryExtended } from './views/ProfileSummary';
export { createProfileSummary } from './views/ProfileSummary';
export type { Author, AuthorExtended } from './views/Author';
export { createAuthor } from './views/Author';
export type { PublicProfile, PublicProfileExtended } from './views/PublicProfile';
export { createPublicProfile } from './views/PublicProfile';
export type {
  ProfileContext,
} from './views/ProfileContext';
export { createDefaultProfileContext } from './views/ProfileContext';

export type { SessionProfileView } from './views/SessionProfileView';
export type { MentionableProfileView } from './views/MentionableProfileView';
export type { DirectMessageRecipientView } from './views/DirectMessageRecipientView';
export type { ProfileAccountSnapshot } from './views/ProfileAccountSnapshot';
export type {
  ProfileLikeActivityRecord,
  ProfileSaveActivityRecord,
  ProfilePollVoteActivityRecord,
} from './views/ProfileActivityRecords';

export type {
  PlanType,
  ProfilePlan,
  ProfileStatus,
  ProfilePermissions,
  ProfileReputation,
} from './contracts/ProfileRuntimeContracts';

export type {
  ProfileAssociatedBusiness,
  ProfileBusinessModuleSnapshot,
} from './services/ProfileBusinessTypes';

export type {
  ProfileActivityStats,
  ProfilePrivacySettingsInput,
} from './services/ProfileOperationTypes';

export type { ProfilePermissionsView } from './views/ProfilePermissionsView';
export {
  createDefaultPermissionsView,
  createRestrictedPermissionsView,
  createModeratorPermissionsView,
} from './views/ProfilePermissionsView';

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

export {
  toCanonicalProfile,
  toCanonicalProfiles,
  type CanonicalProfile,
} from "./mappers";

export { profileService, ProfileService } from "./services/ProfileService";
export {
  ProfileVerificationAdminService,
  profileVerificationAdminService,
} from "./services/ProfileVerificationAdminService";
export type {
  CreateProfileData,
  UpdateProfileData,
  AdminProfileListItem,
  AdminFilters,
  BasePermissions,
  ProfilePrivateWorkspace,
  ProfileIdentitySnapshot,
  ProfileOperationsCounts,
  ProfileManagedAssetItem,
  ProfileNotificationsSnapshot,
  ProfileNotificationItem,
  ProfileEffectivePermission,
  ProfileVerificationStatusValue,
} from "./services/types";
export { ProfileError } from "./services/types";
export type {
  PendingVerification,
  VerificationStats,
} from "./services/ProfileVerificationAdminService";

export { usePrivateProfileWorkspace } from "./hooks/usePrivateProfileWorkspace";
export { useProfileEditor } from "./hooks/useProfileEditor";

export { MultiProfileProvider, ModuleContextSync, useMultiProfileContext } from './contexts/multi-profile-runtime-context.tsx';
export type { MultiProfileContextValue } from './contexts/multi-profile-runtime-context.tsx';
export { useModuleProfile } from './hooks/useModuleProfile';
export type { UseModuleProfileResult, ModuleProfileState } from './hooks/useModuleProfile';

export { ActiveProfileBadge } from './components/ActiveProfileBadge';
export { ModuleProfileGate } from './components/ModuleProfileGate';
export { buildProfileEditUrl, buildPublicProfileUrl } from "./utils/publicProfileUrl";

