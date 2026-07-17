/**
 * Tipos canonicos do dominio de notifications.
 *
 * O sistema ainda convive com tipos legados mais amplos (`system`, `community`)
 * e tipos granulares mais novos (`post_like`, `ride_request`).
 * O contrato oficial precisa suportar ambos enquanto a migracao nao termina.
 */

export const NotificationType = {
  SYSTEM: "system",
  COMMUNITY: "community",
  MOBILITY: "mobility",
  BUSINESS: "business",
  MODERATION: "moderation",
  ACHIEVEMENT: "achievement",
  REMINDER: "reminder",
  LIKE: "like",

  RIDE_REQUEST: "ride_request",
  RIDE_ACCEPTED: "ride_accepted",
  RIDE_STARTED: "ride_started",
  RIDE_COMPLETED: "ride_completed",
  RIDE_CANCELLED: "ride_cancelled",
  PAYMENT_RECEIVED: "payment_received",
  NEW_RATING: "new_rating",

  POST_LIKE: "post_like",
  POST_COMMENT: "post_comment",
  COMMENT_REPLY: "comment_reply",
  MENTION: "mention",
  FOLLOW: "follow",

  APPOINTMENT_NEW: "appointment_new",
  APPOINTMENT_CONFIRMED: "appointment_confirmed",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  APPOINTMENT_REMINDER: "appointment_reminder",
  APPOINTMENT_COMPLETED: "appointment_completed",

  BADGE_EARNED: "badge_earned",
  LEVEL_UP: "level_up",
  ACHIEVEMENT_UNLOCKED: "achievement_unlocked",

  SYSTEM_ALERT: "system_alert",
  SYSTEM_UPDATE: "system_update",
  SYSTEM_MAINTENANCE: "system_maintenance",

  PROMOTION: "promotion",
  COUPON: "coupon",
  EVENT: "event",

  ALERT_NEARBY: "alert_nearby",
  ALERT_CONFIRMATION: "alert_confirmation",
  ALERT_UPDATE: "alert_update",
} as const;

export type CanonicalNotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export type NotificationTypeValue = CanonicalNotificationType | (string & {});
export type NotificationType = NotificationTypeValue;

export const NotificationPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type NotificationPriority =
  (typeof NotificationPriority)[keyof typeof NotificationPriority];

export const NotificationCategory = {
  TRANSACTIONAL: "transactional",
  SOCIAL: "social",
  SYSTEM: "system",
  MARKETING: "marketing",
} as const;

export type NotificationCategory =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];

export interface RideNotificationMetadata {
  ride_id: string;
  driver_profile_id?: string;
  driver_name?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  origin?: string;
  destination?: string;
  price?: number;
  rating?: number;
}

export interface CommunityNotificationMetadata {
  post_id?: string;
  comment_id?: string;
  actor_id?: string;
  actor_name?: string;
  actor_avatar?: string;
  content_preview?: string;
}

export interface AppointmentNotificationMetadata {
  appointment_id: string;
  business_id?: string;
  business_name?: string;
  service_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  client_name?: string;
  client_phone?: string;
}

export interface GamificationNotificationMetadata {
  badge_id?: string;
  badge_name?: string;
  badge_icon?: string;
  level?: number;
  achievement_id?: string;
  achievement_name?: string;
  points_earned?: number;
}

export interface AlertNotificationMetadata {
  alert_id?: string;
  alert_type?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  severity?: "low" | "medium" | "high" | "critical";
}

export interface SystemNotificationMetadata {
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

export type NotificationMetadata =
  | RideNotificationMetadata
  | CommunityNotificationMetadata
  | AppointmentNotificationMetadata
  | GamificationNotificationMetadata
  | AlertNotificationMetadata
  | SystemNotificationMetadata
  | Record<string, unknown>;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationTypeValue;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  priority: NotificationPriority;
  metadata: NotificationMetadata;
  action_url?: string;
  action_label?: string;
  created_at: string;
  updated_at?: string;
  deleted_at: string | null;
  read_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface NotificationCursor {
  createdAt: string;
  id: string;
}

export interface NotificationFilters {
  type?: NotificationTypeValue | NotificationTypeValue[];
  priority?: NotificationPriority | NotificationPriority[];
  read?: boolean;
  category?: NotificationCategory;
  limit?: number;
  cursor?: NotificationCursor;
}

export interface CreateNotificationParams {
  user_id: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  priority?: NotificationPriority;
  metadata?: NotificationMetadata;
}

export interface NotificationGroup {
  type: NotificationTypeValue;
  count: number;
  latest: Notification;
  notifications: Notification[];
}

export interface NotificationRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Notification;
  old: Notification | null;
}
