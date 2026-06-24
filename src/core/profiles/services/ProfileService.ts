import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { getServicesByProfile } from "@/core/professional/services/professional.queries";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { adminRolesService } from "@/core/admin/services/AdminRolesService";
import { publicIdentityService, PublicIdentityService } from "@/core/public-identity";
import { callRPC } from "@/integrations/supabase";
import { PROFILE_VERIFICATION_STATUS } from "@/core/profile/constants/verificationStatus";
import type {
  AdminFilters,
  AdminProfileListItem,
  BasePermissions,
  CreateProfileData,
  PlanType,
  Profile,
  ProfileContext,
  ProfilePrivateWorkspace,
  ProfilePrivacySettingsInput,
  ProfileSummary,
  ProfileSummaryExtended,
  UpdateProfileData,
  ProfileVerificationStatusValue,
} from "./types";
import type {
  ProfileLikeActivityRecord,
  ProfilePollVoteActivityRecord,
  ProfileSaveActivityRecord,
} from "@/core/profiles/views/ProfileActivityRecords";
import type {
  ProfilePermissions,
  ProfileStatus,
} from "@/core/profiles/contracts/ProfileRuntimeContracts";
import type {
  BusinessRow,
  PassengerRatingRow,
  ProfileFilterRow,
  ProfileIdRow,
  RecentProfileRow,
  RideProfileRow,
  UserSubscriptionLike,
  VerificationWorkflowStatus,
} from "./profile.service.types";
import {
  mapBusinessRecords,
  resolveVerificationStatus,
} from "./profile.service.rules";
import {
  buildPermissionMatrix,
} from "./profile.workspace.rules";
import { buildBusinessModuleSnapshot } from "./profile.workspace.business-modules";
import { getPrivateWorkspaceAggregate } from "./profile.workspace.aggregate";
import {
  getUserLikeActivityQuery,
  getUserMentionsQuery,
  getUserPollVoteActivityQuery,
  getUserSaveActivityQuery,
} from "./profile.activity.queries";
import {
  addProfileMemberMutation,
  getProfileMembersQuery,
  isProfileOwnerQuery,
} from "./profile.membership.queries";
import { updateProfileCommand } from "./profile.identity.commands";
import { getProfileContextAggregate } from "./profile.context.aggregate";
import { getProfileStatsAggregate } from "./profile.stats.aggregate";
import {
  clearActiveRideId as clearActiveRideIdMutation,
  createProfileWithIdentityValidation,
  deleteProfile as deleteProfileMutation,
  ensureActiveDriverProfileForUser,
  setActiveRideId as setActiveRideIdMutation,
  suspendUser as suspendUserMutation,
  updateAlertBanStatus as updateAlertBanStatusMutation,
  updatePrivacySettingsDirect,
  updateProfileDirect,
  uploadAvatar as uploadAvatarMutation,
  updateVerificationStatus as updateVerificationStatusMutation,
  verifyUser as verifyUserMutation,
} from "./profile.mutations";
import {
  getUserFavoriteBusinessesQuery,
  getUserFavoritesCountQuery,
  getUserBusinessesByProfilesQuery,
  getUserBusinessesQuery,
  searchProfilesByNameQuery,
} from "./profile.external-data.queries";
import {
  getActiveProfileRpc,
  getActiveRideId as getActiveRideIdQuery,
  getAllUsers as getAllUsersQuery,
  getAllProfileIds as getAllProfileIdsQuery,
  getAdminProfilesList as getAdminProfilesListQuery,
  checkUsernameExists as checkUsernameExistsQuery,
  getByUsername as getByUsernameQuery,
  getPassengerRatings as getPassengerRatingsQuery,
  getProfileById as getProfileByIdQuery,
  getProfileByType as getProfileByTypeQuery,
  getPublicProfileById as getPublicProfileByIdQuery,
  getProfilesByUserId as getProfilesByUserIdQuery,
  getProfilesByIds as getProfilesByIdsQuery,
  getProfilesByVerificationStatus as getProfilesByVerificationStatusQuery,
  getProfilesCreatedInPeriod as getProfilesCreatedInPeriodQuery,
  getProfilesFiltered as getProfilesFilteredQuery,
  getProfilesForRides as getProfilesForRidesQuery,
  getProfilesSummary as getProfilesSummaryQuery,
  getProfilesSummaryExtended as getProfilesSummaryExtendedQuery,
  getProfilesWithAlertBan as getProfilesWithAlertBanQuery,
  getRecentProfiles as getRecentProfilesQuery,
  getRanking as getRankingQuery,
  getSimilarUsernames as getSimilarUsernamesQuery,
  getTotalProfilesCount as getTotalProfilesCountQuery,
  getUserIdsByCity as getUserIdsByCityQuery,
  getUsernameHistory as getUsernameHistoryQuery,
  getVerificationStats as getVerificationStatsQuery,
  resolveProfileIdByUserId,
} from "./profile.queries";
export class ProfileService {
  private async withFallback<T>(
    action: string,
    fallback: T,
    run: () => Promise<T>,
    metadata: Record<string, unknown> = {},
  ): Promise<T> {
    try {
      return await run();
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action,
        metadata,
      });
      return fallback;
    }
  }
  private async withVoidAction(
    action: string,
    run: () => Promise<void>,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await run();
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action,
        metadata,
      });
      throw error;
    }
  }
  async getProfileContext(userId: string): Promise<ProfileContext | null> {
    return getProfileContextAggregate({ userId, getActiveProfile: (id) => this.getActiveProfile(id) });
  }
  async getProfileById(profileId: string): Promise<Profile | null> { return getProfileByIdQuery(profileId); }
  async getActiveProfile(userId?: string): Promise<Profile | null> { return getActiveProfileRpc(userId); }
  async getProfilesByUserId(userId?: string): Promise<Profile[]> { return getProfilesByUserIdQuery(userId); }
  async resolveProfileId(identifier: string): Promise<string | null> {
    const directProfile = await this.getProfileById(identifier);
    if (directProfile?.id) return directProfile.id;
    return this.resolveProfileIdByUserId(identifier);
  }
  async getProfileByType(userId: string, profileType: "personal" | "driver" | "business" | "professional"): Promise<Profile | null> {
    return getProfileByTypeQuery(userId, profileType);
  }
  async ensureDriverProfileForUser(userId: string): Promise<Profile | null> { return ensureActiveDriverProfileForUser(userId); }
  async getRequiredActiveProfile(userId?: string): Promise<Profile> {
    const profile = await this.getActiveProfile(userId);
    if (!profile) {
      throw new Error("No active profile found for user");
    }
    return profile;
  }
  async getByUsername(username: string): Promise<Profile | null> {
    return getByUsernameQuery(username);
  }
  async getPublicProfileById(profileId: string): Promise<Profile | null> {
    return getPublicProfileByIdQuery(profileId);
  }
  async getByHandle(handle: string): Promise<Profile | null> {
    return this.getByUsername(handle);
  }
  async createProfile(profile: CreateProfileData): Promise<Profile> {
    return createProfileWithIdentityValidation(profile);
  }
  async switchActiveProfile(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const { error } = await callRPC("switch_active_profile", {
      p_user_id: userId,
      p_profile_id: profileId,
    });
    if (error) {
      trackError(new Error("Error switching profile"), {
        component: "ProfileService",
        action: "switchActiveProfile",
        metadata: { userId, profileId, error },
      });
      throw error;
    }
  }
  async updateProfile(
    profileId: string,
    updates: UpdateProfileData,
  ): Promise<Profile> {
    return updateProfileCommand({
      profileId,
      updates,
      getProfileById: (id) => this.getProfileById(id),
      updateProfileDirect: (id, payload) => updateProfileDirect(id, payload),
    });
  }
  private async _updateProfileDirect(
    profileId: string,
    updates: UpdateProfileData,
  ): Promise<Profile> {
    return updateProfileDirect(profileId, updates);
  }
  async updatePrivacySettings(
    profileId: string,
    settings: ProfilePrivacySettingsInput,
  ): Promise<Profile> {
    return updatePrivacySettingsDirect(profileId, settings);
  }
  async updateAlertBanStatus(
    profileId: string,
    alertBanned: boolean,
  ): Promise<Profile> {
    return updateAlertBanStatusMutation(profileId, alertBanned);
  }
  async deleteProfile(profileId: string): Promise<void> {
    await deleteProfileMutation(profileId);
  }
  async getProfilesWithAlertBan(profileIds: string[]): Promise<
    Array<{
      id: string;
      alert_banned: boolean;
      neighborhood: string | null;
      created_at: string;
    }>
  > {
    return getProfilesWithAlertBanQuery(profileIds);
  }
  async getPrivateWorkspace(userId: string): Promise<ProfilePrivateWorkspace> {
    return getPrivateWorkspaceAggregate({
      userId,
      getActiveProfile: (id) => this.getActiveProfile(id),
      getProfileContext: (id) => this.getProfileContext(id),
      getProfilesByUserId: (id) => this.getProfilesByUserId(id),
      getUserRoles: (id) => this.getUserRoles(id),
      getUserLikesCount: (profileId) => this.getUserLikesCount(profileId),
      getUserBusinessesByProfiles: (profileIds) => this.getUserBusinessesByProfiles(profileIds),
      resolvePermissions: (profileContext) =>
        profileContext?.permissions ?? {
          canPost: false,
          canComment: false,
          canMessage: false,
          canCreateBusiness: false,
          canModerate: false,
        },
    });
  }
  async getStats(userId: string) {
    return getProfileStatsAggregate({
      userId,
      getActiveProfile: (id) => this.getActiveProfile(id),
      getUserLikesCount: (profileId) => this.getUserLikesCount(profileId),
    });
  }
  // ESTATISTICAS ADMINISTRATIVAS
  async getTotalProfilesCount(): Promise<number> {
    return getTotalProfilesCountQuery();
  }
  async getRecentProfiles(limit = 10): Promise<RecentProfileRow[]> {
    return getRecentProfilesQuery(limit);
  }
  async getProfilesCreatedInPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return getProfilesCreatedInPeriodQuery(startDate, endDate);
  }
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    return uploadAvatarMutation(userId, file);
  }
  async isUsernameAvailable(
    username: string,
    excludeProfileId?: string,
  ): Promise<boolean> {
    try {
      const availability = await PublicIdentityService.checkAvailability({
        identifier: username,
        entityType: 'profile',
        excludeEntityId: excludeProfileId,
      });
      return availability.status === 'available';
    } catch (error) {
      trackError(new Error("Error verifying username"), {
        component: "ProfileService",
        action: "isUsernameAvailable",
        metadata: { username, error },
      });
      return false;
    }
  }
  async isHandleAvailable(
    handle: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    return this.isUsernameAvailable(handle, excludeUserId);
  }
  // READ MODELS TIPADOS - GATE 2
  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    return getProfilesByIdsQuery(ids);
  }
  async getProfilesSummary(ids: string[]): Promise<ProfileSummary[]> {
    return getProfilesSummaryQuery(ids);
  }
  async getProfilesSummaryExtended(
    ids: string[],
  ): Promise<ProfileSummaryExtended[]> {
    return getProfilesSummaryExtendedQuery(ids);
  }
  async getAdminProfilesList(
    filters?: AdminFilters,
  ): Promise<AdminProfileListItem[]> {
    return getAdminProfilesListQuery(filters);
  }
  async getProfilesFiltered(filters: {
    search?: string;
    profileType?: string;
    visibility?: "all" | "public" | "private";
    page?: number;
    limit?: number;
  }): Promise<{ data: ProfileFilterRow[]; total: number }> {
    return getProfilesFilteredQuery(filters);
  }
  async getAllProfileIds(): Promise<string[]> {
    return getAllProfileIdsQuery();
  }
  async getBasePermissions(userId: string): Promise<BasePermissions> {
    const context = await this.getProfileContext(userId);
    return {
      canPost: context?.permissions.canPost ?? false,
      canComment: context?.permissions.canComment ?? false,
      canMessage: context?.permissions.canMessage ?? false,
    };
  }
  async getActiveRideId(profileId: string): Promise<string | null> {
    return getActiveRideIdQuery(profileId);
  }
  async setActiveRideId(
    profileId: string,
    rideId: string | null,
  ): Promise<void> {
    await setActiveRideIdMutation(profileId, rideId);
  }
  async clearActiveRideId(profileId: string, rideId: string): Promise<void> {
    await clearActiveRideIdMutation(profileId, rideId);
  }
  async getProfilesForRides(
    ids: string[],
    type: "passenger" | "driver",
  ): Promise<RideProfileRow[]> {
    return getProfilesForRidesQuery(ids, type);
  }
  async unsuspendUser(userId: string): Promise<void> {
    await this.updateProfile(userId, {
      is_suspended: false,
      suspended: false,
      suspended_until: null,
      suspension_reason: undefined,
    });
  }
  async verifyUser(userId: string): Promise<void> {
    await verifyUserMutation(userId);
  }
  async getProfilesByVerificationStatus(
    status: VerificationWorkflowStatus,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at';
    }
  ): Promise<Profile[]> {
    return getProfilesByVerificationStatusQuery(status, options);
  }
  async getUserIdsByCity(city: string, limit = 500): Promise<string[]> {
    return getUserIdsByCityQuery(city, limit);
  }
  async getVerificationStats(): Promise<{
    total_pending: number;
    total_verified: number;
    total_rejected: number;
  }> {
    return getVerificationStatsQuery();
  }
  async updateVerificationStatus(
    profileId: string,
    status: VerificationWorkflowStatus,
    reason?: string
  ): Promise<void> {
    await updateVerificationStatusMutation(profileId, status, reason);
  }
  async approveVerification(profileId: string): Promise<void> {
    await this.updateVerificationStatus(profileId, 'verified');
  }
  async rejectVerification(profileId: string, reason?: string): Promise<void> {
    await this.updateVerificationStatus(profileId, 'rejected', reason);
  }
  async revokeVerification(profileId: string): Promise<void> {
    await this.updateVerificationStatus(profileId, 'none');
  }
  async suspendUser(
    userId: string,
    duration: string,
    reason: string,
  ): Promise<void> {
    await suspendUserMutation(userId, duration, reason);
  }
  async getAllUsers(): Promise<
    Array<{
      id: string;
      name: string;
      status: ProfileStatus;
      avatar_url?: string;
      verified: boolean;
      permissions: ProfilePermissions;
      reputation: number;
    }>
  > {
    return getAllUsersQuery();
  }
  // SSOT: metodos auxiliares para dados complementares de perfil
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const roles = await adminRolesService.getUserRoles(userId);
      return roles.map((r) => r.role);
    } catch (error) {
      trackError(new Error("Error fetching user roles"), {
        component: "ProfileService",
        action: "getUserRoles",
        metadata: { userId, error },
      });
      return [];
    }
  }
  async getShareActivityDefault(userId: string): Promise<boolean> {
    const profiles = await this.getProfilesByUserId(userId);
    const profile = profiles.find((item) => item.is_active) ?? profiles[0];
    return profile?.share_activity_default ?? true;
  }
  async updateShareActivityDefault(userId: string, shareDefault: boolean): Promise<void> {
    const profiles = await this.getProfilesByUserId(userId);
    const profile = profiles.find((item) => item.is_active) ?? profiles[0];
    if (!profile) {
      throw new Error("Perfil ativo nao encontrado");
    }
    await this.updatePrivacySettings(profile.id, {
      share_activity_default: shareDefault,
    });
  }
  async getUserLikesCount(profileId: string): Promise<number> {
    try {
      // Import dinamico evita ciclo ProfileService <-> SocialInteractionsService.
      const { SocialInteractionsService } = await import(
        "@/core/social/services/SocialInteractionsService"
      );
      const stats = await SocialInteractionsService.getInteractionStats(profileId);
      return stats.likesGiven || 0;
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "getUserLikesCount",
        metadata: { profileId },
      });
      return 0;
    }
  }
  private async resolveProfileIdByUserId(userId: string): Promise<string | null> {
    return resolveProfileIdByUserId(userId);
  }
  async getUserFavoritesCount(userId: string): Promise<number> {
    return getUserFavoritesCountQuery(userId);
  }
  async getUserBusinessesByProfiles(profileIds: string[]): Promise<BusinessRow[]> {
    try {
      return await getUserBusinessesByProfilesQuery(profileIds);
    } catch (error) {
      trackError(new Error("Error fetching user businesses"), {
        component: "ProfileService",
        action: "getUserBusinessesByProfiles",
        metadata: { profileIds, error },
      });
      return [];
    }
  }
  async getUserBusinesses(profileId: string): Promise<BusinessRow[]> {
    try {
      return await getUserBusinessesQuery(profileId);
    } catch (error) {
      trackError(new Error("Error fetching user businesses"), {
        component: "ProfileService",
        action: "getUserBusinesses",
        metadata: { profileId, error },
      });
      return [];
    }
  }
  async getUserFavoriteBusinesses(userId: string): Promise<BusinessRow[]> {
    return getUserFavoriteBusinessesQuery(userId);
  }
  async getRanking(
    limit: number = 50,
  ): Promise<
    Array<{ id: string; name: string; avatar_url: string; pontos: number }>
  > {
    return getRankingQuery(limit);
  }
  async getDriverData(profileId: string): Promise<unknown | null> {
    void profileId;
    return null;
  }
  async getUserMentions(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfileLikeActivityRecord[]> {
    return getUserMentionsQuery(userId, from, to);
  }
  async getUserLikeActivity(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfileLikeActivityRecord[]> {
    const profileId = await this.resolveProfileIdByUserId(userId);
    if (!profileId) return [];
    return getUserLikeActivityQuery(profileId, from, to);
  }
  async getUserSaveActivity(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfileSaveActivityRecord[]> {
    const profileId = await this.resolveProfileIdByUserId(userId);
    if (!profileId) return [];
    return getUserSaveActivityQuery(profileId, from, to);
  }
  async getUserPollVoteActivity(
    userId: string,
    from: number,
    to: number,
  ): Promise<ProfilePollVoteActivityRecord[]> {
    return getUserPollVoteActivityQuery(userId, from, to);
  }
  async getLowRatedUsers(params: {
    maxRating: number;
    minRides: number;
    limit: number;
  }): Promise<PassengerRatingRow[]> {
    return this.getPassengerRatings({
      minRides: params.minRides,
      limit: params.limit,
      maxRating: params.maxRating,
      ascending: true,
      errorLabel: "low rated users",
    });
  }
  async getTopPassengers(params: {
    minRides: number;
    limit: number;
  }): Promise<PassengerRatingRow[]> {
    return this.getPassengerRatings({
      minRides: params.minRides,
      limit: params.limit,
      ascending: false,
      errorLabel: "top passengers",
    });
  }
  private async getPassengerRatings(params: {
    minRides: number;
    limit: number;
    ascending: boolean;
    maxRating?: number;
    errorLabel: string;
  }): Promise<PassengerRatingRow[]> {
    return getPassengerRatingsQuery(params);
  }
  async searchProfilesByName(
    searchQuery: string,
    maxResults: number = 10,
  ): Promise<Profile[]> {
    try {
      return await searchProfilesByNameQuery(searchQuery, maxResults);
    } catch (error) {
      trackError(error as Error, {
        component: "ProfileService",
        action: "searchProfilesByName",
        metadata: { searchQuery, maxResults },
      });
      return [];
    }
  }
  async getProfileMembers(
    profileId: string,
  ): Promise<Array<{ user_id: string; role: string }>> {
    return this.withFallback(
      "getProfileMembers",
      [],
      () => getProfileMembersQuery(profileId),
      { profileId },
    );
  }
  async isProfileOwner(profileId: string, userId: string): Promise<boolean> {
    return this.withFallback(
      "isProfileOwner",
      false,
      () => isProfileOwnerQuery(profileId, userId),
      { profileId, userId },
    );
  }
  async addMember(
    profileId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member",
  ): Promise<void> {
    await this.withVoidAction(
      "addMember",
      () => addProfileMemberMutation({ profileId, userId, role }),
      { profileId, userId, role },
    );
  }
  // SSOT: USERNAME MANAGEMENT (para ProfileIdentityAdapter)
  static async checkUsernameExists(
    username: string,
    excludeId?: string
  ): Promise<boolean> {
    return checkUsernameExistsQuery(username, excludeId);
  }
  static async getSimilarUsernames(
    username: string,
    limit = 20
  ): Promise<string[]> {
    return getSimilarUsernamesQuery(username, limit);
  }
  static async getUsernameHistory(profileId: string): Promise<Array<{
    id: string;
    profile_id: string;
    old_username: string;
    new_username: string;
    change_reason: string;
    changed_at: string;
  }>> {
    return getUsernameHistoryQuery(profileId);
  }
}
// Profile facade - interface unificada SSOT.
export { ProfileFacade } from "./profile.facade";
export const profileService = new ProfileService();
