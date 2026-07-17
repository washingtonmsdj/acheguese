import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { adminRolesService } from "@/core/admin/services/AdminRolesService";
import { residenceService } from "@/core/residence/services/ResidenceService";
import { useCommunityRollout } from "@/core/community/hooks/useCommunityRollout";
import { useSessionContext } from "@/core/session";
import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";
import { CommunityMembershipService } from "@/core/community-experience/services/CommunityMembershipService";
import {
  isCommunityAccessRouteTarget,
  resolveCommunityAccess,
  resolveCommunityAccessTargetLocationIds,
  type CommunityAccessDecision,
  type CommunityAccessLevel,
  type CommunityAccessTarget,
} from "./CommunityAccessPolicy";
import {
  isPersistedCommunityId,
  type CommunityMembershipRecord,
} from "@/core/community-experience/types";

export interface UseCommunityAccessInput {
  readonly resolved: CommunityAccessTarget;
  readonly activeMemberIds?: readonly string[];
}

export interface UseCommunityAccessResult extends Omit<
  CommunityAccessDecision,
  "isLoading"
> {
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly isModerator: boolean;
  readonly residenceLocationId: string | null;
  readonly isResidenceVerified: boolean;
  readonly communityId: string | null;
  readonly membership: CommunityMembershipRecord | null;
  readonly membershipStatus: CommunityMembershipRecord["status"] | null;
  readonly canRequestMembership: boolean;
  readonly isRequestingMembership: boolean;
  readonly requestMembership: () => Promise<CommunityMembershipRecord | null>;
}

function loadingDecision(
  level: CommunityAccessLevel = "public_preview",
): CommunityAccessDecision {
  return {
    level,
    isLoading: false,
    can: {
      view_public_preview: true,
      view_member_feed: false,
      create_post: false,
      create_issue: false,
      create_alert: false,
      comment: false,
      react: false,
      save: false,
      send_message: false,
      join_group: false,
      create_group: false,
      report: false,
      moderate: false,
      manage_portal: false,
    },
    reason: "visitor",
    primaryAction: "none",
    targetLocationIds: [],
  };
}

function getCommunityAccessTargetKey(resolved: CommunityAccessTarget): string {
  if (!resolved) return "none";
  if (resolved.kind === "group") return `group:${resolved.group.id}`;
  return `location:${resolved.location.id}`;
}

export function useCommunityAccess({
  resolved,
  activeMemberIds = [],
}: UseCommunityAccessInput): UseCommunityAccessResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeProfile, isLoading: sessionLoading } = useSessionContext();
  const targetLocationIds = useMemo(
    () => resolveCommunityAccessTargetLocationIds(resolved, activeMemberIds),
    [activeMemberIds, resolved],
  );
  const routeResolved = isCommunityAccessRouteTarget(resolved)
    ? resolved
    : undefined;
  const { isLoading: rolloutLoading, isBlocked } = useCommunityRollout(
    routeResolved,
    targetLocationIds[0] ?? null,
  );
  const isAuthenticated = Boolean(user?.id);
  const routeTargetKey = useMemo(
    () => getCommunityAccessTargetKey(routeResolved ?? null),
    [routeResolved],
  );

  const rolesQuery = useQuery({
    queryKey: ["community-access", "roles", user?.id],
    queryFn: () => adminRolesService.getUserRoles(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
  });

  const residenceQuery = useQuery({
    queryKey: ["community-access", "primary-residence", user?.id],
    queryFn: () => residenceService.getPrimaryResidence(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 2 * 60 * 1000,
  });

  const communityProfileQuery = useQuery({
    queryKey: ["community-access", "local-community", routeTargetKey],
    queryFn: async () => {
      if (!routeResolved) return null;
      const community =
        await CommunityExperienceService.getCommunityProfile(routeResolved);
      return isPersistedCommunityId(community.id) ? community : null;
    },
    enabled:
      isAuthenticated && Boolean(activeProfile?.id) && Boolean(routeResolved),
    staleTime: 5 * 60 * 1000,
  });

  const communityId = communityProfileQuery.data?.id ?? null;
  const membershipRequired =
    Boolean(communityId) || communityProfileQuery.isError;

  const membershipQuery = useQuery({
    queryKey: [
      "community-access",
      "membership",
      communityId,
      activeProfile?.id,
    ],
    queryFn: async () => {
      if (!communityId || !activeProfile?.id) return null;
      return CommunityMembershipService.findByCommunityAndProfile(
        communityId,
        activeProfile.id,
      );
    },
    enabled: Boolean(communityId && activeProfile?.id),
    staleTime: 60 * 1000,
  });

  const requestMembershipMutation = useMutation({
    mutationFn: async () => {
      if (!communityId || !activeProfile?.id || !user?.id) {
        throw new Error("community_membership_context_missing");
      }

      const membership = await CommunityMembershipService.requestMembership({
        communityId,
        profileId: activeProfile.id,
      });

      if (!membership) {
        throw new Error("community_membership_request_failed");
      }

      return membership;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "community-access",
          "membership",
          communityId,
          activeProfile?.id,
        ],
      });
    },
  });

  const isAdmin = useMemo(
    () =>
      (rolesQuery.data ?? []).some(
        (role) => role.role === "admin" && role.is_active,
      ),
    [rolesQuery.data],
  );
  const isModerator = useMemo(
    () =>
      (rolesQuery.data ?? []).some(
        (role) => role.role === "moderator" && role.is_active,
      ),
    [rolesQuery.data],
  );

  const baseAccessLoading =
    sessionLoading ||
    (isAuthenticated && (rolesQuery.isLoading || residenceQuery.isLoading));
  const needsRolloutDecision =
    isAuthenticated &&
    Boolean(activeProfile?.id) &&
    Boolean(routeResolved) &&
    !isAdmin &&
    !isModerator;
  const membershipAccessLoading =
    isAuthenticated &&
    Boolean(activeProfile?.id) &&
    Boolean(routeResolved) &&
    (communityProfileQuery.isLoading ||
      (Boolean(communityId) && membershipQuery.isLoading));
  const isLoading =
    baseAccessLoading ||
    (needsRolloutDecision && rolloutLoading) ||
    membershipAccessLoading;

  const decision = useMemo(() => {
    if (isLoading)
      return loadingDecision(
        isAuthenticated ? "authenticated" : "public_preview",
      );

    return resolveCommunityAccess({
      isAuthenticated,
      hasActiveProfile: Boolean(activeProfile?.id),
      isAdmin,
      isModerator,
      residence: residenceQuery.data
        ? {
            locationId: residenceQuery.data.location_id ?? null,
            isVerified: Boolean(residenceQuery.data.is_verified),
          }
        : null,
      membership: membershipQuery.data
        ? {
            communityId: membershipQuery.data.community_id,
            role: membershipQuery.data.role,
            status: membershipQuery.data.status,
            verifiedByResidence: membershipQuery.data.verified_by_residence,
          }
        : null,
      membershipRequired,
      resolved,
      activeMemberIds,
      rolloutEnabled: !isBlocked,
    });
  }, [
    activeMemberIds,
    activeProfile?.id,
    isAdmin,
    isAuthenticated,
    isLoading,
    isBlocked,
    isModerator,
    membershipRequired,
    membershipQuery.data,
    residenceQuery.data,
    resolved,
  ]);

  return {
    ...decision,
    isLoading,
    isAuthenticated,
    isAdmin: decision.level === "admin",
    isModerator: decision.level === "moderator" || decision.level === "admin",
    residenceLocationId: residenceQuery.data?.location_id ?? null,
    isResidenceVerified: Boolean(residenceQuery.data?.is_verified),
    communityId,
    membership: membershipQuery.data ?? null,
    membershipStatus: membershipQuery.data?.status ?? null,
    canRequestMembership: Boolean(
      communityId &&
      activeProfile?.id &&
      user?.id &&
      !membershipQuery.data &&
      !membershipQuery.isLoading,
    ),
    isRequestingMembership: requestMembershipMutation.isPending,
    requestMembership: async () => requestMembershipMutation.mutateAsync(),
  };
}
