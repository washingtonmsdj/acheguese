/**
 * Notifications services - SSOT exports.
 */

export { NotificationService, notificationService } from "./NotificationService";
export { CommunityNotificationBrokerService } from "./CommunityNotificationBrokerService";
export { ProfessionalNotificationBrokerService } from "./ProfessionalNotificationBrokerService";
export { PushNotificationPreferencesService } from "./PushNotificationPreferencesService";
export { UserNotificationPreferencesService } from "./UserNotificationPreferencesService";

export type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
  NotificationPriority,
  NotificationStats,
  NotificationTypeValue as NotificationType,
} from "../types";

export { normalizeNotification } from "../utils/normalizeNotification";
