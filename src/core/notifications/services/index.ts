/**
 * 🔔 NOTIFICATIONS SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export { NotificationService, notificationService } from "./NotificationService";

// ============================================================
// 📦 LEGACY - Re-exports de types
// ============================================================
export type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
  NotificationPriority,
  NotificationStats,
  NotificationSettings,
  NotificationTypeValue as NotificationType,
} from "../types";

// ============================================================
// 🛠️ UTILS
// ============================================================
export { normalizeNotification } from "../utils/normalizeNotification";
