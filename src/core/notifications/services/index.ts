/**
 * 🔔 NOTIFICATIONS SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
export {
  fetchNotifications,
  getStats,
  getNotificationSettings,
  getUnreadCount,
} from "./notifications.queries";

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationSettings,
  cleanupOldNotifications,
} from "./notifications.mutations";

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export { NotificationsFacade, NotificationService, notificationService } from "./NotificationService";

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
