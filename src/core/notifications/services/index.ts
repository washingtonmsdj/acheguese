/**
 * Notifications services - SSOT exports.
 */

export {
  NotificationService,
  notificationService,
} from "./NotificationService";
export { ProfessionalNotificationBrokerService } from "./ProfessionalNotificationBrokerService";
export * from "./NotificationPreferencesService";

export type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
  NotificationCursor,
  NotificationPriority,
  NotificationStats,
  NotificationTypeValue as NotificationType,
} from "../types";

export { normalizeNotification } from "../utils/normalizeNotification";
