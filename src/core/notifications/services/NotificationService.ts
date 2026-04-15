/**
 * 🔔 NOTIFICATIONS SERVICE - FACHADA SSOT v2.0
 *
 * ✅ Ponto único de entrada para operações de notificações
 * ✅ Mantém compatibilidade com código existente
 * ✅ Delega para módulos especializados por responsabilidade
 *
 * REFATORAÇÃO v2.0.0:
 * - Queries → notifications.queries.ts
 * - Mutations → notifications.mutations.ts
 * - Types → ../types.ts (SSOT)
 *
 * ⚠️ NÃO adicionar lógica diretamente neste arquivo.
 * Use os módulos especializados acima.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 📦 QUERIES - Operações de leitura
// ============================================================
export {
  fetchNotifications,
  getStats,
  getNotificationSettings,
  getUnreadCount,
} from "./notifications.queries";

// ============================================================
// ✏️ MUTATIONS - Operações de escrita
// ============================================================
export {
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateNotificationSettings,
  cleanupOldNotifications,
} from "./notifications.mutations";

// Re-exports de types
export type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
  NotificationPriority,
  NotificationStats,
  NotificationSettings,
  NotificationTypeValue as NotificationType,
} from "../types";

// Re-exports do normalizeNotification
export { normalizeNotification } from "../utils/normalizeNotification";

// ============================================================================
// 🏛️ SSOT v2.0 - FACADE
// ============================================================================

import * as NotificationsQueries from "./notifications.queries";
import * as NotificationsMutations from "./notifications.mutations";

/**
 * 🔔 NotificationsFacade - Interface SSOT unificada v2.0
 *
 * Uso: NotificationsFacade.queries.fetchNotifications(userId)
 *      NotificationsFacade.mutations.createNotification(params)
 *      NotificationsFacade.mutations.markAsRead(notificationId)
 */
export const NotificationsFacade = {
  queries: NotificationsQueries,
  mutations: NotificationsMutations,
} as const;

/**
 * @deprecated Use NotificationsFacade ou os exports diretos dos módulos notifications.queries e notifications.mutations
 * NotificationService como classe mantido para compatibilidade.
 */
export class NotificationService {
  // ===== QUERIES =====
  fetchNotifications = NotificationsQueries.fetchNotifications;
  getStats = NotificationsQueries.getStats;
  getNotificationSettings = NotificationsQueries.getNotificationSettings;
  getUnreadCount = NotificationsQueries.getUnreadCount;

  // ===== MUTATIONS =====
  createNotification = NotificationsMutations.createNotification;
  markAsRead = NotificationsMutations.markAsRead;
  markAllAsRead = NotificationsMutations.markAllAsRead;
  deleteNotification = NotificationsMutations.deleteNotification;
  updateNotificationSettings = NotificationsMutations.updateNotificationSettings;
  cleanupOldNotifications = NotificationsMutations.cleanupOldNotifications;

  // ===== REALTIME (mantido na classe por ser específico) =====
  createRealtimeChannel(
    userId: string,
    onNotification: (notification: Notification) => void,
  ) {
    try {
      import("@/core/realtime").then(({ realtimeService }) => {
        return realtimeService.subscribeToNotifications(userId, (notification) => {
          onNotification(notification);
        });
      });
    } catch (error) {
      console.error("[NotificationService] Error creating realtime channel:", error);
      throw error;
    }
  }
}

// Singleton legado
export const notificationService = new NotificationService();
