/**
 * Profile services - SSOT exports.
 */

export { ProfileService, profileService } from "./ProfileService";

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
// Types
// ============================================================
export type {
  ProfileRow,
  ProfileType,
  CreateProfilePayload,
  UpdateProfilePayload,
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
  ProfileVerificationStatus,
} from "./types";
