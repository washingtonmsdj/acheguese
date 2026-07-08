import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { adminRolesService } from "@/core/admin/services/AdminRolesService";
import { residenceService } from "@/core/residence/services/ResidenceService";
import { useCommunityRollout } from "@/core/community/hooks/useCommunityRollout";
import { useSessionContext } from "@/core/session";
import {
  isCommunityAccessRouteTarget,
  resolveCommunityAccess,
  resolveCommunityAccessTargetLocationIds,
  type CommunityAccessDecision,
  type CommunityAccessLevel,
  type CommunityAccessTarget,
} from "./CommunityAccessPolicy";

export interface UseCommunityAccessInput {
  readonly resolved: CommunityAccessTarget;
  readonly activeMemberIds?: readonly string[];
}

export interface UseCommunityAccessResult extends Omit<CommunityAccessDecision, "isLoading"> {
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly isModerator: boolean;
  readonly residenceLocationId: string | null;
  readonly isResidenceVerified: boolean;
}

function loadingDecision(level: CommunityAccessLevel = "public_preview"): CommunityAccessDecision {
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

export function useCommunityAccess({
  resolved,
  activeMemberIds = [],
}: UseCommunityAccessInput): UseCommunityAccessResult {
  const { user } = useAuth();
  const { activeProfile, isLoading: sessionLoading } = useSessionContext();
  const targetLocationIds = useMemo(
    () => resolveCommunityAccessTargetLocationIds(resolved, activeMemberIds),
    [activeMemberIds, resolved],
  );
  const routeResolved = isCommunityAccessRouteTarget(resolved) ? resolved : undefined;
  const { isLoading: rolloutLoading, isBlocked } = useCommunityRollout(
    routeResolved,
    targetLocationIds[0] ?? null,
  );
  const isAuthenticated = Boolean(user?.id);

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

  const isAdmin = useMemo(
    () => (rolesQuery.data ?? []).some((role) => role.role === "admin" && role.is_active),
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
  const hasResidenceLocation = Boolean(residenceQuery.data?.location_id);
  const needsRolloutDecision =
    isAuthenticated && Boolean(activeProfile?.id) && hasResidenceLocation && !isAdmin && !isModerator;
  const isLoading = baseAccessLoading || (needsRolloutDecision && rolloutLoading);

  const decision = useMemo(() => {
    if (isLoading) return loadingDecision(isAuthenticated ? "authenticated" : "public_preview");

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
    residenceQuery.data,
    resolved,
  ]);

  return {
    ...decision,
    isLoading,
    isAuthenticated,
    isAdmin,
    isModerator,
    residenceLocationId: residenceQuery.data?.location_id ?? null,
    isResidenceVerified: Boolean(residenceQuery.data?.is_verified),
  };
}
