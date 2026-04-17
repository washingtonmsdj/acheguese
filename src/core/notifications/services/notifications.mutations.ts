/**
 * Compatibility exports for notifications write operations.
 * Canonical implementation lives in NotificationService.ts.
 */

export {
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationSettings,
  cleanupOldNotifications,
} from "./NotificationService";

