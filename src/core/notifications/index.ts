/**
 * Core Notifications Barrel Export
 */

// Services
export { CommunityNotificationBrokerService } from './services/CommunityNotificationBrokerService';
export { NotificationService } from './services/NotificationService';
export { ProfessionalNotificationBrokerService } from './services/ProfessionalNotificationBrokerService';
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
export { UnifiedNotificationBell } from './components/UnifiedNotificationBell';
