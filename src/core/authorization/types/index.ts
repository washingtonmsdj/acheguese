/**
 * Authorization Engine Types
 *
 * Validates: Requirements 4.1–4.9, 5.1–5.7
 *
 * These types are EXCLUSIVELY for the Authorization_Engine.
 * Session_Context_System does NOT use these types.
 */

// ============================================================================
// ACTION
// ============================================================================

/**
 * Explicit semantic action names supported by the Authorization_Engine.
 *
 * Requirement 4.6 — The Authorization_Engine SHALL support these actions.
 * Requirement 4.7 — Prevents semantic use of user_id in social/domain flows.
 */
export type Action =
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
  | "banUser"
  | "suspendUser"
  | "reviewContent"
  | "voteOnContent"
  | "uploadMedia"
  | "reportContent";

// ============================================================================
// ACTION CONTEXT
// ============================================================================

/**
 * Context in which an action is performed.
 * Context influences authorization decisions (not just cache keys).
 *
 * Requirement 4.5 — Authorization_Engine SHALL consider context in decisions.
 */
export interface ActionContext {
  communityId?: string;
  businessId?: string;
  eventId?: string;
}

// ============================================================================
// TARGET ENTITY
// ============================================================================

/**
 * The target entity of an action (post, comment, business, etc.).
 * Used for ownership verification.
 *
 * Requirement 4.4 — Authorization_Engine SHALL consider ownership/target entity.
 * Requirement 4.9 — Authorization_Engine SHALL verify if profile owns/controls the target entity.
 */
export interface TargetEntity {
  type: "post" | "comment" | "message" | "business" | "event" | "media";
  id: string;
}

// ============================================================================
// PROFILE STATUS
// ============================================================================

/**
 * Status of a profile used in authorization decisions.
 *
 * Requirement 4.8 — IF a profile is suspended or blocked, the Authorization_Engine
 * SHALL deny all restricted actions.
 */
export interface ProfileStatus {
  isActive: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
}

// ============================================================================
// PROFILE TYPE
// ============================================================================

/**
 * Type of a profile.
 *
 * NOTE: Profile type is identity data, NOT an authorization criterion.
 * Authorization decisions MUST use canProfilePerformAction(), never profile type directly.
 *
 * Requirement 5.2 — profile_id (and its type) is used for social/domain actions.
 */
export type ProfileType =
  | "personal"
  | "business"
  | "driver"
  | "professional"
  | "community";

// ============================================================================
// PERMISSION
// ============================================================================

/**
 * Result of a permission evaluation for a given action.
 *
 * - 'allowed'        — profile can perform the action in the given context
 * - 'denied'         — profile cannot perform the action
 * - 'requiresTarget' — cannot be evaluated without a specific target entity;
 *                      use canProfilePerformAction() with targetEntity
 *
 * WARNING: Permission[] returned by getProfilePermissions() is for UI display ONLY.
 * NEVER use it for authorization decisions — always use canProfilePerformAction().
 *
 * Requirement 4.2 — canProfilePerformAction() is the authoritative decision method.
 */
export interface Permission {
  action: Action;
  status: "allowed" | "denied" | "requiresTarget";
}
