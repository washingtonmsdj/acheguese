/**
 * ============================================
 * MÓDULO DE NOTIFICAÇÕES (SSOT)
 * ============================================
 *
 * CONTRATO ARQUITETURAL:
 *
 * 1. ÚNICO PONTO DE ACESSO
 *    - useUnifiedNotifications é o ÚNICO hook permitido
 *    - notificationService é o ÚNICO service permitido
 *    - Nenhum acesso direto ao Supabase é permitido
 *
 * 2. PROIBIÇÕES ABSOLUTAS
 *    ❌ Acessar tabela 'notifications' diretamente via supabase.from()
 *    ❌ Criar hooks alternativos de notificações
 *    ❌ Criar services alternativos de notificações
 *    ❌ Duplicar lógica de notificações
 *    ❌ Criar channels Realtime fora do hook oficial
 *
 * 3. REGRAS DE USO
 *    ✅ Codigo novo deve preferir '@/core/notifications'
 *    ✅ Este modulo existe como fachada de compatibilidade legada
 *    ✅ Usar notificationService para criar notificações
 *    ✅ Usar helpers para notificações específicas
 *    ✅ Usar tipos centralizados
 *
 * 4. EVOLUÇÃO
 *    - Novos tipos: adicionar em notification.types.ts
 *    - Novos helpers: adicionar em notification.helpers.ts
 *    - Novos componentes: adicionar em components/
 *    - Nunca criar alternativas ao sistema existente
 *
 * ============================================
 */

// ============================================
// HOOK OFICIAL (ÚNICO PERMITIDO)
// ============================================
export { useUnifiedNotifications } from "./hooks/useUnifiedNotifications";

// ============================================
// SERVICE OFICIAL (ÚNICO PERMITIDO)
// ============================================
export { notificationService } from "./services/notification.service";

// ============================================
// TIPOS CENTRALIZADOS
// ============================================
export {
  NotificationType,
  NotificationPriority,
  type Notification,
  type NotificationStats,
  type NotificationFilters,
  type CreateNotificationParams,
  type NotificationMetadata,
  type RideNotificationMetadata,
  type CommunityNotificationMetadata,
  type AppointmentNotificationMetadata,
  type GamificationNotificationMetadata,
  type AlertNotificationMetadata,
  type SystemNotificationMetadata,
} from "./types/notification.types";

// ============================================
// HELPERS OFICIAIS
// ============================================
export {
  // Mobilidade
  notifyRideRequest,
  notifyRideAccepted,
  notifyRideCompleted,
  notifyNewRating,

  // Comunidade
  notifyPostLike,
  notifyPostComment,
  notifyMention,

  // Agendamentos
  notifyNewAppointment,
  notifyAppointmentReminder,

  // Gamificação
  notifyBadgeEarned,
  notifyLevelUp,

  // Sistema
  notifySystemAlert,
} from "./helpers/notification.helpers";

// ============================================
// COMPONENTES OFICIAIS
// ============================================
export { UnifiedNotificationBellV2 } from "./components/notifications/UnifiedNotificationBellV2";

// ============================================
// NOTA IMPORTANTE
// ============================================
//
// Este módulo é SSOT (Single Source of Truth).
// Qualquer tentativa de criar sistemas paralelos
// ou acessar diretamente o banco de dados deve
// ser bloqueada em code review.
//
// Para adicionar funcionalidades:
// 1. Discutir com o time
// 2. Adicionar no módulo existente
// 3. Manter o contrato arquitetural
//
// ============================================
