import type {
  AppRole,
  CapabilityAction,
  CapabilityPreviewContext,
  CapabilityPreviewResult,
  CapabilityPreviewSubject,
  CapabilityTargetHint,
} from "../types";

export const CAPABILITY_ACTIONS: readonly CapabilityAction[] = [
  "createPost",
  "editPost",
  "deletePost",
  "createComment",
  "editComment",
  "deleteComment",
  "createMessage",
  "editMessage",
  "deleteMessage",
  "createBusiness",
  "editBusiness",
  "deleteBusiness",
  "moderateContent",
  "verifyUser",
  "suspendUser",
  "reviewContent",
  "voteOnContent",
  "uploadMedia",
  "reportContent",
] as const;

const TARGET_ACTIONS = new Set<CapabilityAction>([
  "editPost",
  "deletePost",
  "editComment",
  "deleteComment",
  "editMessage",
  "deleteMessage",
  "editBusiness",
  "deleteBusiness",
]);

const ELEVATED_ACTIONS = new Set<CapabilityAction>([
  "moderateContent",
  "verifyUser",
  "suspendUser",
]);

const ELEVATED_ROLES = new Set<AppRole>(["super_admin", "admin", "moderator"]);

export function actionNeedsRoleLookup(action: CapabilityAction): boolean {
  return ELEVATED_ACTIONS.has(action);
}

export function evaluateCapabilityPreview(
  subject: CapabilityPreviewSubject | null,
  action: CapabilityAction,
  context: CapabilityPreviewContext = {},
  target?: CapabilityTargetHint,
): CapabilityPreviewResult {
  if (!subject) {
    return { action, status: "denied", reason: "anonymous" };
  }
  if (subject.isBlocked) {
    return { action, status: "denied", reason: "blocked-profile" };
  }
  if (subject.isSuspended) {
    return { action, status: "denied", reason: "suspended-profile" };
  }
  if (!subject.isActive) {
    return { action, status: "denied", reason: "inactive-profile" };
  }

  if (TARGET_ACTIONS.has(action)) {
    if (!target?.ownerProfileIdHint) {
      return { action, status: "requiresTarget", reason: "target-required" };
    }
    return target.ownerProfileIdHint === subject.profileId
      ? { action, status: "allowed", reason: "owner-hint" }
      : { action, status: "denied", reason: "non-owner-hint" };
  }

  if (ELEVATED_ACTIONS.has(action)) {
    if (subject.roles.some((role) => ELEVATED_ROLES.has(role))) {
      return { action, status: "allowed", reason: "elevated-role" };
    }
    if (action === "moderateContent" && context.communityModeratorHint === true) {
      return { action, status: "allowed", reason: "community-moderator-hint" };
    }
    return { action, status: "denied", reason: "role-required" };
  }

  return { action, status: "allowed", reason: "active-profile" };
}

export function buildCapabilityPreviewMatrix(
  subject: CapabilityPreviewSubject,
  context: CapabilityPreviewContext = {},
): CapabilityPreviewResult[] {
  return CAPABILITY_ACTIONS.map((action) =>
    evaluateCapabilityPreview(subject, action, context),
  );
}
