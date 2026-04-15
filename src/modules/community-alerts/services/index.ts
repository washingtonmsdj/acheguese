/**
 * 🚨 COMMUNITY ALERTS SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export {
  CommunityAlertServiceClass,
  communityAlertService,
} from "./CommunityAlertService";

// ============================================================
// 🔧 SERVICES ESPECIALIZADOS
// ============================================================
export {
  AlertModerationService,
  alertModerationService,
} from "./AlertModerationService";

export {
  AlertNotificationService,
  alertNotificationService,
} from "./AlertNotificationService";
