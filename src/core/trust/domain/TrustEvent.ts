export const TRUST_ACTOR_ROLES = {
  CUSTOMER: "customer",
  MERCHANT: "merchant",
  COURIER: "courier",
  DRIVER: "driver",
  PROFESSIONAL: "professional",
  ADMIN: "admin",
  SYSTEM: "system",
} as const;

export type TrustActorRole =
  (typeof TRUST_ACTOR_ROLES)[keyof typeof TRUST_ACTOR_ROLES];

export const TRUST_CONTEXT_TYPES = {
  ORDER: "order",
  RIDE: "ride",
  DELIVERY: "delivery",
  CLASSIFIED: "classified",
  SERVICE: "service",
  COMMUNITY: "community",
} as const;

export type TrustContextType =
  (typeof TRUST_CONTEXT_TYPES)[keyof typeof TRUST_CONTEXT_TYPES];

export const TRUST_EVENT_TYPES = {
  REVIEW: "review",
  INCIDENT: "incident",
  LATE_CANCELLATION: "late_cancellation",
  NO_SHOW: "no_show",
  OPERATIONAL_FEEDBACK: "operational_feedback",
  ADMIN_ACTION: "admin_action",
} as const;

export type TrustEventType =
  (typeof TRUST_EVENT_TYPES)[keyof typeof TRUST_EVENT_TYPES];

export const TRUST_VISIBILITIES = {
  PUBLIC: "public",
  PRIVATE: "private",
  ADMIN_ONLY: "admin_only",
} as const;

export type TrustVisibility =
  (typeof TRUST_VISIBILITIES)[keyof typeof TRUST_VISIBILITIES];

export const TRUST_EVENT_STATUSES = {
  ACTIVE: "active",
  UNDER_REVIEW: "under_review",
  DISMISSED: "dismissed",
  CONFIRMED: "confirmed",
  PENALIZED: "penalized",
} as const;

export type TrustEventStatus =
  (typeof TRUST_EVENT_STATUSES)[keyof typeof TRUST_EVENT_STATUSES];

export type TrustSeverity = "low" | "medium" | "high" | "critical";

export interface TrustEvent {
  id: string;
  actor_profile_id: string | null;
  actor_role: TrustActorRole;
  subject_profile_id: string;
  subject_role: TrustActorRole;
  context_type: TrustContextType;
  context_id: string;
  event_type: TrustEventType;
  rating: number | null;
  reason_code: string;
  severity: TrustSeverity;
  visibility: TrustVisibility;
  description: string | null;
  evidence: Record<string, unknown>;
  status: TrustEventStatus;
  reviewed_by_profile_id: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustScoreSummary {
  profile_id: string;
  role: TrustActorRole;
  average_rating: number | null;
  total_events: number;
  incident_count: number;
  late_cancellation_count: number;
  high_severity_count: number;
  reliability_score: number;
}

export type TrustRiskLevel = "trusted" | "watchlist" | "restricted" | "critical";

export type TrustDispatchPolicy =
  | "normal"
  | "limited_priority"
  | "review_before_assignment"
  | "block_until_admin_review";

export interface TrustPolicyDecision {
  profile_id: string;
  role: TrustActorRole;
  summary: TrustScoreSummary;
  risk_level: TrustRiskLevel;
  dispatch_policy: TrustDispatchPolicy;
  recommended_action:
    | "none"
    | "monitor"
    | "warn"
    | "manual_review"
    | "temporary_restriction";
  recurrence_30d: number;
  recurrence_90d: number;
  reasons: string[];
}

export const TRUST_ADMIN_ACTION_TYPES = {
  WARNING: "warning",
  TEMPORARY_RESTRICTION: "temporary_restriction",
  CLEAR_RESTRICTION: "clear_restriction",
  NOTE_ONLY: "note_only",
} as const;

export type TrustAdminActionType =
  (typeof TRUST_ADMIN_ACTION_TYPES)[keyof typeof TRUST_ADMIN_ACTION_TYPES];

export interface TrustAdminAction {
  id: string;
  trust_event_id: string | null;
  subject_profile_id: string;
  subject_role: TrustActorRole;
  action_type: TrustAdminActionType;
  applied_by_profile_id: string;
  reason: string;
  notes: string | null;
  starts_at: string;
  ends_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function resolveTrustActorRoleFromProfileType(profileType?: string | null): TrustActorRole {
  if (profileType === "driver") {
    return TRUST_ACTOR_ROLES.DRIVER;
  }
  if (profileType === "business") {
    return TRUST_ACTOR_ROLES.MERCHANT;
  }
  return TRUST_ACTOR_ROLES.CUSTOMER;
}
