/**
 * Profile services - SSOT exports.
 */

// ============================================================
// Facade
// ============================================================
export {
  ProfileFacade,
  ProfileService,
  profileService,
} from "./ProfileService";

// ============================================================
// Queries
// ============================================================
export {
  getProfileById,
  getActiveProfile,
  getProfilesByUserId,
  getProfileByType,
  getByUsername,
  getPublicProfileById,
  getProfilesByIds,
  getProfilesSummary,
  getProfilesSummaryExtended,
  getAdminProfilesList,
  getStats,
  getTotalProfilesCount,
  getRecentProfiles,
  getProfilesCreatedInPeriod,
  isUsernameAvailable,
  getSimilarUsernames,
  getUsernameHistory,
} from "./profile.queries";

// ============================================================
// Mutations
// ============================================================
export {
  createProfile,
  updateProfile,
  updatePrivacySettings,
  switchActiveProfile,
  deleteProfile,
  uploadAvatar,
  ensureDriverProfileForUser,
  checkUsernameAvailability,
} from "./profile.mutations";

// ============================================================
// Specialized services
// ============================================================
export {
  ProfileVerificationAdminService,
  profileVerificationAdminService,
} from "./ProfileVerificationAdminService";

// ============================================================
// Types
// ============================================================
export type {
  Profile,
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
  ProfilePrivateWorkspace,
  ProfileIdentitySnapshot,
  ProfileOperationsCounts,
  ProfileManagedAssetItem,
  ProfileNotificationsSnapshot,
  ProfileNotificationItem,
  ProfileEffectivePermission,
  ProfilePrivacySettingsInput,
  ProfileVerificationStatusValue,
} from "./types";
export { ProfileError } from "./types";

export type {
  PendingVerification,
  VerificationStats,
} from "./ProfileVerificationAdminService";
