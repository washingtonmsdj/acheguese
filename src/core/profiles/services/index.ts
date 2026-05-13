/**
 * 👤 PROFILE SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export {
  ProfileFacade,
  ProfileService,
  profileService,
} from "./ProfileService";

// ============================================================
// 🎯 QUERIES - Operações de leitura
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
// ✏️ MUTATIONS - Operações de escrita
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
// 🔧 ADAPTERS E SERVICES ESPECIALIZADOS
// ============================================================
export {
  profileMobilityAdapter,
  ProfileMobilityAdapter,
} from "./ProfileMobilityAdapter";
export {
  ProfileVerificationAdminService,
  profileVerificationAdminService,
} from "./ProfileVerificationAdminService";

// ============================================================
// 📦 TYPES
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
  ProfilePrivacySettingsInput,
  ProfileVerificationStatusValue,
} from "./types";
export { ProfileError } from "./types";

export type {
  PendingVerification,
  VerificationStats,
} from "./ProfileVerificationAdminService";
