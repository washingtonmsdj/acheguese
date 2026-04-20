/**
 * Community Alerts Module — Barrel Export
 * Apenas API pública. Internals não são exportados.
 */

// ============================================================================
// Components
// ============================================================================
export { AlertFeedSection } from "./components/AlertFeedSection";
export { AlertCard } from "./components/AlertCard";
export { CreateAlertModal } from "./components/CreateAlertModal";

// ============================================================================
// Hooks
// ============================================================================
export { useAlerts } from "./hooks/useAlerts";
export { useAlertsBySpatialRadius } from "./hooks/useAlertsBySpatialRadius";
export { useCreateAlert } from "./hooks/useCreateAlert";
export { useAlertReport } from "./hooks/useAlertReport";

// ============================================================================
// Services (para uso em outros módulos via core se necessário)
// ============================================================================
export { communityAlertService } from "./services/CommunityAlertService";
export { alertModerationService } from "./services/AlertModerationService";

// ============================================================================
// Config (feature flag e labels — consumidos por outros módulos)
// ============================================================================
export {
  COMMUNITY_ALERTS_ENABLED,
  ALERT_CATEGORY_LABELS,
  ALERT_REPORT_REASON_LABELS,
} from "./config/alertConfig";

// ============================================================================
// Types
// ============================================================================
export type {
  AlertCategory,
  AlertStatus,
  AlertStartedApprox,
  AlertAuditAction,
  AlertReportReason,
  AlertTrustSnapshot,
  CommunityAlert,
  CommunityAlertPublic,
  CreateAlertPayload,
  UpdateAlertPayload,
  CommunityAlertReport,
  CommunityAlertAudit,
  AlertFeedFilters,
  AlertRpcResult,
  AlertRpcError,
} from "./domain/types";
