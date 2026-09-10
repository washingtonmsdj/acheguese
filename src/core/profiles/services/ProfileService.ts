import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { getServicesByProfile } from "@/core/professional/services/professional.queries";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { RoleService } from "@/core/authorization/services/RoleService";
import {
  publicIdentityService,
  PublicIdentityService,
} from "@/core/public-identity";
import { SessionRpcService } from "@/core/session/services/SessionRpcService";
import {
  ProfileRpcService,
  type VisibleProfileContact,
} from "./ProfileRpcService";
import { callRPC } from "@/integrations/supabase";
import { PROFILE_VERIFICATION_STATUS } from "@/core/profiles/constants/verificationStatus";
import { getSocialInteractionStatsByProfile } from "@/core/social/services/socialInteractionStats.queries";
import type {
  AdminFilters,
  AdminProfileListItem,
  BasePermissions,
  CreateProfilePayload,
  PlanType,
  ProfileContext,
  ProfilePrivateWorkspace,
  ProfilePrivacySettingsInput,
  ProfileRow as Profile,
  ProfileSummary,
  ProfileSummaryExtended,
  OwnedProfileUpdatePayload,
} from "./types";
import type { ProfileVerificationStatus } from "@/core/profiles/constants/verificationStatus";
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
  UserSubscriptionLike,
} from "./profile.service.types";
import {
  mapBusinessRecords,
  resolveVerificationStatus,
} from "./profile.service.rules";
import { buildPermissionMatrix } from "./profile.workspace.rules";
import { buildBusinessModuleSnapshot } from "./profile.workspace.business-modules";
import { getPrivateWorkspaceAggregate } from "./profile.workspace.aggregate";
import {
  getUserLikeActivityQuery,
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
  createProfileWithIdentityValidation,
  ensureActiveDriverProfileForUser,
  uploadAvatar as uploadAvatarMutation,
} from "./profile.mutations";
import {
  getCurrentUserFavoriteBusinessesQuery,
  getUserBusinessesByProfilesQuery,
  getUserBusinessesQuery,
  searchProfilesByNameQuery,
} from "./profile.external-data.queries";
import {
  getActiveProfileRpc,
  getSuspendedUsers as getSuspendedUsersQuery,
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
  getProfilesCreatedInPeriod as getProfilesCreatedInPeriodQuery,
  getProfilesFiltered as getProfilesFilteredQuery,
  getProfilesSummary as getProfilesSummaryQuery,
  getProfilesSummaryExtended as getProfilesSummaryExtendedQuery,
  getRecentProfiles as getRecentProfilesQuery,
  getSimilarUsernames as getSimilarUsernamesQuery,
  getTotalProfilesCount as getTotalProfilesCountQuery,
  getUsernameHistory as getUsernameHistoryQuery,
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
    return getProfileContextAggregate({
      userId,
      getActiveProfile: (id) => this.getActiveProfile(id),
    });
  }
  async getProfileById(profileId: string): Promise<Profile | null> {
    return getProfileByIdQuery(profileId);
  }
  async getAccessibleProfileById(profileId: string): Promise<Profile | null> {
    const profiles = await this.getAccessibleProfilesByIds([profileId]);
    return profiles[0] ?? null;
  }
  async getActiveProfile(userId?: string): Promise<Profile | null> {
    return getActiveProfileRpc(userId);
  }
  async getProfilesByUserId(userId?: string): Promise<Profile[]> {
    return getProfilesByUserIdQuery(userId);
  }
  async getAccessibleProfilesByUserIds(userIds: string[]): Promise<Profile[]> {
    const uniqueUserIds = [...new Set(userIds)];
    const profiles: Profile[] = [];

    for (let offset = 0; offset < uniqueUserIds.length; offset += 10) {
      const batchUserIds = uniqueUserIds.slice(offset, offset + 10);
      const batch = await Promise.all(
        batchUserIds.map((targetUserId) =>
          ProfileRpcService.getAccessibleProfiles<Profile[]>({ targetUserId }),
        ),
      );
      profiles.push(...batch.flat());
    }

    return profiles;
  }
  async resolveProfileId(identifier: string): Promise<string | null> {
    const directProfile = await this.getProfileById(identifier);
    if (directProfile?.id) return directProfile.id;
    return this.resolveProfileIdByUserId(identifier);
  }
  async getProfileByType(
    userId: string,
    profileType: "personal" | "driver" | "business" | "professional",
  ): Promise<Profile | null> {
    return getProfileByTypeQuery(userId, profileType);
  }
  async ensureDriverProfileForUser(userId: string): Promise<Profile | null> {
    return ensureActiveDriverProfileForUser(userId);
  }
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
  async createProfile(profile: CreateProfilePayload): Promise<Profile> {
    return createProfileWithIdentityValidation(profile);
  }
  async switchActiveProfile(userId: string, profileId: string): Promise<void> {
    const switched = await SessionRpcService.switchActiveProfile(profileId);
    if (!switched) {
      trackError(new Error("Error switching profile"), {
        component: "ProfileService",
        action: "switchActiveProfile",
        metadata: { userId, profileId },
      });
      throw new Error("Error switching profile");
    }
  }
  async updateProfile(
    profileId: string,
    updates: OwnedProfileUpdatePayload,
  ): Promise<Profile> {
    return updateProfileCommand({
      profileId,
      updates,
      getProfileById: (id) => this.getAccessibleProfileById(id),
      updateOwnedProfile: (id, payload, newUsername) =>
        this.updateOwnedProfile(id, payload, newUsername),
    });
  }

  private async updateOwnedProfile(
    profileId: string,
    updates: OwnedProfileUpdatePayload,
    newUsername?: string | null,
  ): Promise<Profile> {
    const result = await ProfileRpcService.updateOwnedProfile<{
      success: boolean;
      data?: { profile_id: string; username?: string | null };
      error?: string;
    }>(
      profileId,
      updates as Record<string, unknown>,
      newUsername,
    );

    if (!result.success) {
      throw new Error(result.error || "Profile update rejected");
    }

    const refreshed = await this.getAccessibleProfileById(profileId);
    if (!refreshed) {
      throw new Error("Updated profile could not be reloaded");
    }
    return refreshed;
  }
  async updatePrivacySettings(
    profileId: string,
    settings: ProfilePrivacySettingsInput,
  ): Promise<Profile> {
    const unsupported = [
      settings.show_location !== undefined ? "show_location" : null,
      settings.allow_messages !== undefined ? "allow_messages" : null,
      settings.show_activity !== undefined ? "show_activity" : null,
    ].filter((field): field is string => Boolean(field));

    if (unsupported.length > 0) {
      throw new Error(`Unsupported privacy settings: ${unsupported.join(", ")}`);
    }

    return this.updateOwnedProfile(profileId, {
      ...(settings.is_public !== undefined ? { is_public: settings.is_public } : {}),
      ...(settings.show_email !== undefined
        ? { show_contact_email: settings.show_email }
        : {}),
      ...(settings.show_phone !== undefined ? { show_phone: settings.show_phone } : {}),
      ...(settings.show_businesses !== undefined
        ? { show_business_links: settings.show_businesses }
        : {}),
      ...(settings.share_activity_default !== undefined
        ? { share_activity_default: settings.share_activity_default }
        : {}),
    } as OwnedProfileUpdatePayload);
  }
  async deleteProfile(profileId: string): Promise<void> {
    const result = await ProfileRpcService.deleteProfile<{
      success: boolean;
      error?: string;
    }>(profileId);
    if (!result.success) {
      throw new Error(result.error || "Profile delete rejected");
    }
  }
  async getPrivateWorkspace(userId: string): Promise<ProfilePrivateWorkspace> {
    return getPrivateWorkspaceAggregate({
      userId,
      getActiveProfile: (id) => this.getActiveProfile(id),
      getProfileContext: (id) => this.getProfileContext(id),
      getProfilesByUserId: (id) => this.getProfilesByUserId(id),
      getUserRoles: (id) => this.getUserRoles(id),
      getUserLikesCount: (profileId) => this.getUserLikesCount(profileId),
      getUserBusinessesByProfiles: (profileIds) =>
        this.getUserBusinessesByProfiles(profileIds),
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
  async uploadAvatar(profileId: string, file: File): Promise<string> {
    return uploadAvatarMutation(profileId, file);
  }
  async isUsernameAvailable(
    username: string,
    excludeProfileId?: string,
  ): Promise<boolean> {
    try {
      const availability = await PublicIdentityService.checkAvailability({
        identifier: username,
        entityType: "profile",
        excludeEntityId: excludeProfileId,
      });
      return availability.status === "available";
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
  async getAccessibleProfilesByIds(ids: string[]): Promise<Profile[]> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];

    const profiles: Profile[] = [];
    for (let offset = 0; offset < uniqueIds.length; offset += 100) {
      const profileIds = uniqueIds.slice(offset, offset + 100);
      const batch = await ProfileRpcService.getAccessibleProfiles<Profile[]>({ profileIds });
      profiles.push(...batch);
    }
    return profiles;
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
  async getVisibleContact(profileId: string): Promise<VisibleProfileContact | null> {
    return ProfileRpcService.getVisibleContact(profileId);
  }
  async clearExpiredSuspension(profileId: string): Promise<boolean> {
    const result = await ProfileRpcService.clearExpiredSuspension<{
      success: boolean;
      data?: { profile_id: string; cleared: boolean };
      error?: string;
    }>(profileId);

    if (!result.success) {
      throw new Error(result.error || "Suspension clear rejected");
    }

    return result.data?.cleared ?? false;
  }
  async getSuspendedUsers(limit = 100): Promise<
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
    return getSuspendedUsersQuery(limit);
  }
  // SSOT: metodos auxiliares para dados complementares de perfil
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      return await RoleService.getUserRoles(userId);
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
  async updateShareActivityDefault(
    userId: string,
    shareDefault: boolean,
  ): Promise<void> {
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
      const stats = await getSocialInteractionStatsByProfile(profileId);
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
  private async resolveProfileIdByUserId(
    userId: string,
  ): Promise<string | null> {
    return resolveProfileIdByUserId(userId);
  }
  async getUserBusinessesByProfiles(
    profileIds: string[],
  ): Promise<BusinessRow[]> {
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
  async getCurrentUserFavoriteBusinesses(): Promise<BusinessRow[]> {
    return getCurrentUserFavoriteBusinessesQuery();
  }
  async getDriverData(profileId: string): Promise<unknown | null> {
    void profileId;
    return null;
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
    excludeId?: string,
  ): Promise<boolean> {
    return checkUsernameExistsQuery(username, excludeId);
  }
  static async getSimilarUsernames(
    username: string,
    limit = 20,
  ): Promise<string[]> {
    return getSimilarUsernamesQuery(username, limit);
  }
  static async getUsernameHistory(profileId: string): Promise<
    Array<{
      id: string;
      profile_id: string;
      old_username: string;
      new_username: string;
      change_reason: string;
      changed_at: string;
    }>
  > {
    return getUsernameHistoryQuery(profileId);
  }
}
export const profileService = new ProfileService();
