/**
 * ============================================
 * NOTIFICATION SERVICE (MODULE WRAPPER)
 * ============================================
 * Wrapper do módulo que usa o core service
 * Mantém compatibilidade com código existente
 */

import { notificationService as coreNotificationService } from "@/core/notifications";

// Re-exportar o serviço do core
export const notificationService = coreNotificationService;

// Re-exportar tipos do core
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationFilters,
  CreateNotificationParams,
  NotificationStats,
} from "@/core/notifications";
