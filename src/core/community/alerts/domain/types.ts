/**
 * Community Alerts - Tipos de dominio
 */

export type AlertCategory =
  | "tiroteio_disparos"
  | "assalto_em_andamento"
  | "tentativa_de_invasao"
  | "incendio_explosao"
  | "acidente_grave"
  | "alagamento_deslizamento"
  | "risco_na_via"
  | "pessoa_vulneravel_em_risco";

export type AlertStatus = "ativo" | "encerrado" | "expirado" | "removido";

export type AlertStartedApprox =
  | "just_now"
  | "minutes_5"
  | "minutes_15"
  | "minutes_30"
  | "over_30";

export type AlertAuditAction =
  | "created"
  | "updated"
  | "ended"
  | "removed"
  | "reported"
  | "expired"
  | "reviewed_cleared";

export type AlertReportReason =
  | "false_alert"
  | "promotes_crime"
  | "identifies_person"
  | "monitors_operation"
  | "hate_speech"
  | "spam"
  | "other";

export interface AlertTrustSnapshot {
  phone_verified: boolean;
  account_age_days: number;
  active_strikes: number;
  eligibility_passed: boolean;
  checked_at: string;
}

export interface CommunityAlert {
  id: string;
  author_user_id: string;
  author_profile_id: string;
  category: AlertCategory;
  status: AlertStatus;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;
  neighborhood_display: string | null;
  city: string | null;
  description: string;
  seen_personally: boolean;
  started_at_approx: AlertStartedApprox;
  is_happening_now: boolean;
  still_risky: boolean;
  expires_at: string;
  trust_snapshot: AlertTrustSnapshot;
  report_count: number;
  under_review: boolean;
  edit_count: number;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  removed_at?: string;
  removal_reason?: string;
}

export type CommunityAlertPublic = Omit<
  CommunityAlert,
  "author_user_id" | "trust_snapshot" | "removal_reason" | "under_review" | "neighborhood"
>;

export interface CreateAlertPayload {
  category: AlertCategory;
  location_id: string;
  description: string;
  seen_personally: boolean;
  started_at_approx: AlertStartedApprox;
  is_happening_now: boolean;
  still_risky: boolean;
}

export interface UpdateAlertPayload {
  description?: string;
  still_risky?: boolean;
}

export interface CommunityAlertReport {
  id: string;
  alert_id: string;
  reporter_id: string;
  reason: AlertReportReason;
  created_at: string;
}

export interface CreateAlertReportPayload {
  alert_id: string;
  reason: AlertReportReason;
}

export interface CommunityAlertAudit {
  id: string;
  alert_id: string;
  actor_id: string;
  action_type: AlertAuditAction;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AlertNotificationQueueItem {
  id: string;
  alert_id: string;
  neighborhood: string;
  city: string;
  processed: boolean;
  attempt_count: number;
  processing_started_at?: string;
  processed_at?: string;
  last_error?: string;
  created_at: string;
}

export type AlertRpcError =
  | "not_authenticated"
  | "phone_not_verified"
  | "account_too_new"
  | "profile_not_found"
  | "location_id_required"
  | "location_not_found"
  | "location_must_be_district"
  | "rate_limit_exceeded"
  | "invalid_category"
  | "invalid_description_length"
  | "blocked_content"
  | "duplicate_alert"
  | "internal_error";

export interface AlertRpcResult {
  success?: boolean;
  alert_id?: string;
  error?: AlertRpcError;
  detail?: string;
  count?: number;
  days?: number;
  length?: number;
}

export interface AlertFeedFilters {
  location_id?: string;
  location_ids?: string[];
  category?: AlertCategory;
  limit?: number;
}
