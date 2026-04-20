/**
 * Community Alerts — Tipos de domínio
 * Fonte única de verdade para todos os tipos do módulo
 */

// ============================================================================
// ENUMS / UNION TYPES
// ============================================================================

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

// ============================================================================
// INTERFACES PRINCIPAIS
// ============================================================================

/**
 * Snapshot imutável das condições de elegibilidade no momento da criação.
 * Armazenado como jsonb — nunca atualizado após criação.
 */
export interface AlertTrustSnapshot {
  phone_verified: boolean;
  account_age_days: number;
  active_strikes: number;
  eligibility_passed: boolean;
  checked_at: string; // ISO timestamp
}

/**
 * Entidade completa — shape do banco.
 * Nunca exposta diretamente ao cliente.
 */
export interface CommunityAlert {
  id: string;
  author_user_id: string;       // nunca exposto publicamente
  author_profile_id: string;    // exibido no card
  category: AlertCategory;
  status: AlertStatus;
  location_id: string;          // FK para locations (SSOT territorial)
  latitude: number | null;      // centroide do território (para mapa)
  longitude: number | null;     // centroide do território (para mapa)
  neighborhood: string | null;  // DEPRECATED: mantido para display legado
  neighborhood_display: string | null; // label legível para exibição
  city: string | null;          // DEPRECATED: mantido para display legado
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

/**
 * Projeção pública — o que o feed expõe.
 * Campos sensíveis removidos.
 * Integrado com SSOT territorial via location_id.
 */
export type CommunityAlertPublic = Omit<
  CommunityAlert,
  "author_user_id" | "trust_snapshot" | "removal_reason" | "under_review" | "neighborhood"
>;

/**
 * Dados necessários para criar um alerta (enviados pelo formulário).
 * author_profile_id e author_user_id são derivados pela RPC — não enviados.
 * Integrado com SSOT territorial via location_id.
 */
export interface CreateAlertPayload {
  category: AlertCategory;
  location_id: string;           // FK para locations (type=district) — SSOT territorial
  description: string;
  seen_personally: boolean;
  started_at_approx: AlertStartedApprox;
  is_happening_now: boolean;
  still_risky: boolean;
}

/**
 * Dados para atualizar um alerta (apenas campos editáveis pelo autor).
 */
export interface UpdateAlertPayload {
  description?: string;
  still_risky?: boolean;
}

// ============================================================================
// REPORT
// ============================================================================

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

// ============================================================================
// AUDIT
// ============================================================================

export interface CommunityAlertAudit {
  id: string;
  alert_id: string;
  actor_id: string;
  action_type: AlertAuditAction;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// FILA DE NOTIFICAÇÕES
// ============================================================================

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

// ============================================================================
// RESULTADOS DE OPERAÇÕES
// ============================================================================

export type AlertRpcError =
  | "not_authenticated"
  | "phone_not_verified"
  | "account_too_new"
  | "profile_not_found"
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

// ============================================================================
// FILTROS DE FEED
// ============================================================================

/**
 * Filtros para busca de alertas.
 * Integrado com SSOT territorial via TerritoryFilter.
 */
export interface AlertFeedFilters {
  /** Filtro territorial — usar TerritoryFilter do core/location */
  location_id?: string;          // filtro por bairro único
  location_ids?: string[];       // filtro por múltiplos bairros (grupo)
  category?: AlertCategory;
  limit?: number;
  
  // DEPRECATED: usar location_id/location_ids
  city?: string;
  neighborhood?: string;
}
