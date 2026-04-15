/**
 * Contrato canonico de community-alerts para consumo cross-domain.
 *
 * Enquanto o dominio ainda conclui sua consolidacao interna, outros modulos
 * devem depender desta fachada em vez de importar detalhes de `modules/*`.
 */

export {
  ALERT_CATEGORY_LABELS,
  ALERT_REPORT_REASON_LABELS,
} from "@/modules/community-alerts/config/alertConfig";

export type {
  AlertCategory,
  AlertReportReason,
  AlertStatus,
  CommunityAlert,
  CommunityAlertPublic,
} from "@/modules/community-alerts/domain/types";

export {
  AlertFeedSection,
  CreateAlertModal,
} from "@/modules/community-alerts";

export {
  alertModerationService,
  communityAlertService,
} from "@/modules/community-alerts";
