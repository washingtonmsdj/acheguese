/**
 * UI capability preview contracts.
 *
 * These contracts never authorize a command. The backend remains responsible
 * for enforcement through RLS, RPCs and Edge Functions.
 */

import type { AppRole } from "./roles.types";

export * from "./roles.types";

export type CapabilityAction =
  | "createPost"
  | "editPost"
  | "deletePost"
  | "createComment"
  | "editComment"
  | "deleteComment"
  | "createMessage"
  | "editMessage"
  | "deleteMessage"
  | "createBusiness"
  | "editBusiness"
  | "deleteBusiness"
  | "moderateContent"
  | "verifyUser"
  | "suspendUser"
  | "reviewContent"
  | "voteOnContent"
  | "uploadMedia"
  | "reportContent";

export interface CapabilityPreviewContext {
  communityId?: string;
  businessId?: string;
  eventId?: string;
  /** UI hint only, supplied by an already loaded community membership view. */
  communityModeratorHint?: boolean;
}

export interface CapabilityTargetHint {
  type: "post" | "comment" | "message" | "business" | "event" | "media";
  id: string;
  /** UI hint only. The backend must independently verify ownership. */
  ownerProfileIdHint?: string | null;
}

export interface CapabilityPreviewSubject {
  profileId: string;
  isActive: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
  roles: AppRole[];
}

export type CapabilityPreviewStatus = "allowed" | "denied" | "requiresTarget";

export interface CapabilityPreviewResult {
  action: CapabilityAction;
  status: CapabilityPreviewStatus;
  reason:
    | "anonymous"
    | "active-profile"
    | "inactive-profile"
    | "suspended-profile"
    | "blocked-profile"
    | "elevated-role"
    | "community-moderator-hint"
    | "owner-hint"
    | "non-owner-hint"
    | "target-required"
    | "role-required";
}
