/**
 * Core Notifications Barrel Export
 */

// Services
export { NotificationService } from './services/NotificationService';
export { notificationService } from './services';

// Hooks
export { useUnifiedNotifications } from '@/modules/notifications/hooks/useUnifiedNotifications';

// Types
export {
  NotificationPriority,
  NotificationType,
} from './types';
export type {
  Notification,
  NotificationType,
  NotificationTypeValue,
  NotificationFilters,
  CreateNotificationParams,
  NotificationStats,
  NotificationMetadata,
  RideNotificationMetadata,
  CommunityNotificationMetadata,
  AppointmentNotificationMetadata,
  GamificationNotificationMetadata,
  AlertNotificationMetadata,
  SystemNotificationMetadata,
} from './types';
