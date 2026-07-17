import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type {
  CommunityMembershipRole,
  CommunityMembershipStatus,
} from "@/core/community-experience/types";

export interface CommunityAccessLocationTarget {
  readonly kind: "location";
  readonly location: {
    readonly id: string;
    readonly name?: string | null;
  };
}

export type CommunityAccessTarget =
  | ResolvedTerritory
  | CommunityAccessLocationTarget
  | null;

export type CommunityAccessLevel =
  | "public_preview"
  | "authenticated"
  | "resident"
  | "verified_resident"
  | "community_member"
  | "verified_community_member"
  | "moderator"
  | "admin";

export type CommunityAction =
  | "view_public_preview"
  | "view_member_feed"
  | "create_post"
  | "create_issue"
  | "create_alert"
  | "comment"
  | "react"
  | "save"
  | "send_message"
  | "join_group"
  | "create_group"
  | "report"
  | "moderate"
  | "manage_portal";

export interface CommunityAccessResidence {
  readonly locationId: string | null;
  readonly isVerified: boolean;
}

export interface CommunityAccessMembership {
  readonly communityId: string;
  readonly role: CommunityMembershipRole;
  readonly status: CommunityMembershipStatus;
  readonly verifiedByResidence: boolean;
}

export interface CommunityAccessInput {
  readonly isAuthenticated: boolean;
  readonly hasActiveProfile: boolean;
  readonly isAdmin: boolean;
  readonly isModerator: boolean;
  readonly residence: CommunityAccessResidence | null;
  readonly membership?: CommunityAccessMembership | null;
  readonly membershipRequired?: boolean;
  readonly resolved: CommunityAccessTarget;
  readonly activeMemberIds?: readonly string[];
  readonly rolloutEnabled: boolean;
}

export interface CommunityAccessDecision {
  readonly level: CommunityAccessLevel;
  readonly isLoading: false;
  readonly can: Record<CommunityAction, boolean>;
  readonly reason:
    | "visitor"
    | "missing_profile"
    | "missing_residence"
    | "missing_membership"
    | "membership_pending"
    | "membership_rejected"
    | "membership_blocked"
    | "out_of_territory"
    | "unverified_residence"
    | "rollout_blocked"
    | "allowed";
  readonly primaryAction:
    | "login"
    | "create_profile"
    | "add_address"
    | "verify_address"
    | "request_membership"
    | "waitlist"
    | "none";
  readonly targetLocationIds: readonly string[];
}

const ACTIONS: readonly CommunityAction[] = [
  "view_public_preview",
  "view_member_feed",
  "create_post",
  "create_issue",
  "create_alert",
  "comment",
  "react",
  "save",
  "send_message",
  "join_group",
  "create_group",
  "report",
  "moderate",
  "manage_portal",
];

function emptyPermissions(): Record<CommunityAction, boolean> {
  return Object.fromEntries(ACTIONS.map((action) => [action, false])) as Record<
    CommunityAction,
    boolean
  >;
}

function permissionsFor(
  level: CommunityAccessLevel,
): Record<CommunityAction, boolean> {
  const can = emptyPermissions();
  can.view_public_preview = true;

  if (level === "authenticated") {
    can.report = true;
    return can;
  }

  if (level === "resident") {
    can.view_member_feed = true;
    can.react = true;
    can.save = true;
    can.report = true;
    return can;
  }

  if (level === "verified_resident") {
    can.view_member_feed = true;
    can.create_post = true;
    can.create_issue = true;
    can.create_alert = true;
    can.comment = true;
    can.react = true;
    can.save = true;
    can.send_message = true;
    can.join_group = true;
    can.create_group = true;
    can.report = true;
    return can;
  }

  if (level === "community_member") {
    can.view_member_feed = true;
    can.react = true;
    can.save = true;
    can.report = true;
    return can;
  }

  if (level === "verified_community_member") {
    can.view_member_feed = true;
    can.create_post = true;
    can.create_issue = true;
    can.create_alert = true;
    can.comment = true;
    can.react = true;
    can.save = true;
    can.send_message = true;
    can.join_group = true;
    can.create_group = true;
    can.report = true;
    return can;
  }

  if (level === "moderator" || level === "admin") {
    for (const action of ACTIONS) {
      can[action] = true;
    }
    can.manage_portal = level === "admin";
  }

  return can;
}

export function isCommunityAccessRouteTarget(
  resolved: CommunityAccessTarget,
): resolved is ResolvedTerritory {
  if (!resolved) return false;
  if (resolved.kind === "group") return true;

  return "geographic_path" in resolved.location;
}

export function resolveCommunityAccessTargetLocationIds(
  resolved: CommunityAccessTarget,
  activeMemberIds: readonly string[] = [],
): readonly string[] {
  if (!resolved) return [];
  if (resolved.kind === "location") return [resolved.location.id];

  const activeIds = activeMemberIds.filter(Boolean);
  if (activeIds.length > 0) return [...new Set(activeIds)];

  return resolved.group.members.map((member) => member.id).filter(Boolean);
}

function residenceMatchesTarget(
  residence: CommunityAccessResidence | null,
  targetLocationIds: readonly string[],
): boolean {
  return Boolean(
    residence?.locationId &&
    targetLocationIds.length > 0 &&
    targetLocationIds.includes(residence.locationId),
  );
}

function buildDecision(
  level: CommunityAccessLevel,
  reason: CommunityAccessDecision["reason"],
  primaryAction: CommunityAccessDecision["primaryAction"],
  targetLocationIds: readonly string[],
): CommunityAccessDecision {
  return {
    level,
    isLoading: false,
    can: permissionsFor(level),
    reason,
    primaryAction,
    targetLocationIds,
  };
}

export function resolveCommunityAccess(
  input: CommunityAccessInput,
): CommunityAccessDecision {
  const targetLocationIds = resolveCommunityAccessTargetLocationIds(
    input.resolved,
    input.activeMemberIds,
  );

  if (input.isAdmin) {
    return buildDecision("admin", "allowed", "none", targetLocationIds);
  }

  if (input.isModerator) {
    return buildDecision("moderator", "allowed", "none", targetLocationIds);
  }

  if (!input.isAuthenticated) {
    return buildDecision(
      "public_preview",
      "visitor",
      "login",
      targetLocationIds,
    );
  }

  if (!input.hasActiveProfile) {
    return buildDecision(
      "authenticated",
      "missing_profile",
      "create_profile",
      targetLocationIds,
    );
  }

  if (!input.rolloutEnabled) {
    return buildDecision(
      "authenticated",
      "rollout_blocked",
      "waitlist",
      targetLocationIds,
    );
  }

  if (input.membershipRequired) {
    const membership = input.membership ?? null;

    if (!membership) {
      return buildDecision(
        "authenticated",
        "missing_membership",
        "request_membership",
        targetLocationIds,
      );
    }

    if (membership.status === "pending") {
      return buildDecision(
        "authenticated",
        "membership_pending",
        "none",
        targetLocationIds,
      );
    }

    if (membership.status === "rejected") {
      return buildDecision(
        "authenticated",
        "membership_rejected",
        "none",
        targetLocationIds,
      );
    }

    if (membership.status === "blocked") {
      return buildDecision(
        "authenticated",
        "membership_blocked",
        "none",
        targetLocationIds,
      );
    }

    if (membership.role === "owner" || membership.role === "admin") {
      return buildDecision("admin", "allowed", "none", targetLocationIds);
    }

    if (membership.role === "moderator") {
      return buildDecision("moderator", "allowed", "none", targetLocationIds);
    }

    const isVerifiedLocalResident =
      input.residence?.isVerified === true &&
      residenceMatchesTarget(input.residence, targetLocationIds);

    if (!isVerifiedLocalResident) {
      return buildDecision(
        "community_member",
        "unverified_residence",
        "verify_address",
        targetLocationIds,
      );
    }

    return buildDecision(
      "verified_community_member",
      "allowed",
      "none",
      targetLocationIds,
    );
  }

  if (!input.residence?.locationId) {
    return buildDecision(
      "authenticated",
      "missing_residence",
      "add_address",
      targetLocationIds,
    );
  }

  if (!residenceMatchesTarget(input.residence, targetLocationIds)) {
    return buildDecision(
      "authenticated",
      "out_of_territory",
      "add_address",
      targetLocationIds,
    );
  }

  if (!input.residence.isVerified) {
    return buildDecision(
      "resident",
      "unverified_residence",
      "verify_address",
      targetLocationIds,
    );
  }

  return buildDecision(
    "verified_resident",
    "allowed",
    "none",
    targetLocationIds,
  );
}
