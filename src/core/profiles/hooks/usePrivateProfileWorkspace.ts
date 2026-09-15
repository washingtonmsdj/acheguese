import { useQuery } from "@tanstack/react-query";
import { useSessionUserId } from "@/core/session/hooks/useSessionUserId";
import { profileService } from "@/core/profiles/services";
import type { ProfilePrivateWorkspace } from "@/core/profiles/services";

const EMPTY_WORKSPACE: ProfilePrivateWorkspace = {
  profile: null,
  context: null,
  identity: null,
  account: {
    accountState: "inactive",
    isBlocked: false,
    isSuspended: false,
    verificationStatus: "not_requested",
  },
  stats: {
    posts: 0,
    likes: 0,
    favorites: 0,
    businesses: 0,
  },
  operations: {
    managedProfiles: 0,
    businesses: 0,
    services: 0,
    classifieds: 0,
    posts: 0,
    events: 0,
    alerts: 0,
    issues: 0,
    favoritesGiven: 0,
    favoritesReceived: 0,
    notificationsTotal: 0,
    notificationsUnread: 0,
    ridesTotal: 0,
    activeRides: 0,
  },
  managedAssets: [],
  notifications: {
    total: 0,
    unread: 0,
    highPriority: 0,
    urgentPriority: 0,
    recent: [],
  },
  roles: [],
  businesses: [],
  businessModules: [],
  activeRide: null,
  hasActiveRide: false,
  verificationStatus: "not_requested",
};

export function usePrivateProfileWorkspace() {
  const userId = useSessionUserId();

  const query = useQuery({
    queryKey: ["profile", "private-workspace", userId],
    queryFn: async () => {
      if (!userId) {
        return EMPTY_WORKSPACE;
      }

      return profileService.getPrivateWorkspace(userId);
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  return {
    workspace: query.data || EMPTY_WORKSPACE,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
