import * as profileQueries from "./profile.queries";
import * as profileMutations from "./profile.mutations";

/**
 * ProfileFacade - Interface unificada para operacoes de Profile
 *
 * Organizacao SSOT:
 * - queries: Todas as operacoes de leitura
 * - mutations: Todas as operacoes de escrita
 */
export const ProfileFacade = {
  queries: {
    getProfileById: profileQueries.getProfileById,
    getActiveProfile: profileQueries.getActiveProfile,
    getProfilesByUserId: profileQueries.getProfilesByUserId,
    getProfileByType: profileQueries.getProfileByType,
    getByUsername: profileQueries.getByUsername,
    getPublicProfileById: profileQueries.getPublicProfileById,
    getProfilesByIds: profileQueries.getProfilesByIds,
    getProfilesSummary: profileQueries.getProfilesSummary,
    getProfilesSummaryExtended: profileQueries.getProfilesSummaryExtended,
    getAdminProfilesList: profileQueries.getAdminProfilesList,
    getStats: profileQueries.getStats,
    getTotalProfilesCount: profileQueries.getTotalProfilesCount,
    getRecentProfiles: profileQueries.getRecentProfiles,
    getProfilesCreatedInPeriod: profileQueries.getProfilesCreatedInPeriod,
    isUsernameAvailable: profileQueries.isUsernameAvailable,
    getSimilarUsernames: profileQueries.getSimilarUsernames,
    getUsernameHistory: profileQueries.getUsernameHistory,
  },
  mutations: {
    createProfile: profileMutations.createProfile,
    updateProfile: profileMutations.updateProfile,
    updatePrivacySettings: profileMutations.updatePrivacySettings,
    switchActiveProfile: profileMutations.switchActiveProfile,
    deleteProfile: profileMutations.deleteProfile,
    uploadAvatar: profileMutations.uploadAvatar,
    ensureDriverProfileForUser: profileMutations.ensureDriverProfileForUser,
    checkUsernameAvailability: profileMutations.checkUsernameAvailability,
  },
};
