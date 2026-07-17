/**
 * Core Notifications Barrel Export
 */

// Services
export { NotificationService } from "./services/NotificationService";
export { ProfessionalNotificationBrokerService } from "./services/ProfessionalNotificationBrokerService";
export { notificationService } from "./services";

// Types
export { NotificationPriority, NotificationType } from "./types";
export type {
  Notification,
  NotificationTypeValue,
  NotificationFilters,
  NotificationCursor,
  CreateNotificationParams,
  NotificationStats,
  NotificationMetadata,
  RideNotificationMetadata,
  CommunityNotificationMetadata,
  AppointmentNotificationMetadata,
  GamificationNotificationMetadata,
  AlertNotificationMetadata,
  SystemNotificationMetadata,
} from "./types";
