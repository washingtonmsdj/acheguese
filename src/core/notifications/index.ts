/**
 * Core Notifications Barrel Export
 */

// Services
export { NotificationService } from './services/NotificationService';
export { notificationService } from './services';

// Types
export {
  NotificationPriority,
  NotificationType,
} from './types';
export type {
  Notification,
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

// Components
export { UnifiedNotificationBellV2 } from './components/UnifiedNotificationBellV2';
