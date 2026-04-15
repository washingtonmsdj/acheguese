// CONSTANTES GLOBAIS - SSOT (Single Source of Truth)
// Todas as constantes do sistema centralizadas aqui
// NÃO importar de '@/types' - este arquivo É a fonte

// ============================================
// USER ROLES
// ============================================

export const USER_ROLE = {
  ADMIN: "admin",
  USER: "user",
  DRIVER: "driver",
  PASSENGER: "passenger",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// ============================================
// POST STATUS
// ============================================

export const POST_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

// ============================================
// PAYMENT STATUS
// ============================================

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// ============================================
// PAYMENT METHOD
// ============================================

export const PAYMENT_METHOD = {
  PIX: "pix",
  DINHEIRO: "dinheiro",
  CARTAO: "cartao",
  CREDITO: "credito",
  DEBITO: "debito",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ============================================
// NOTIFICATION TYPE
// ============================================

export const NOTIFICATION_TYPE = {
  RIDE_REQUEST: "ride_request",
  RIDE_ACCEPTED: "ride_accepted",
  RIDE_COMPLETED: "ride_completed",
  RIDE_CANCELLED: "ride_cancelled",
  PAYMENT: "payment",
  MESSAGE: "message",
  ALERT: "alert",
  SYSTEM: "system",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

// ============================================
// DRIVER STATUS
// ============================================

export const DRIVER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  BUSY: "busy",
  UNAVAILABLE: "unavailable",
} as const;

export type DriverStatus = (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS];

// ============================================
// VERIFICATION STATUS
// ============================================

export const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

// ============================================
// ALERT SEVERITY
// ============================================

export const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type AlertSeverity =
  (typeof ALERT_SEVERITY)[keyof typeof ALERT_SEVERITY];

// ============================================
// ALERT STATUS
// ============================================

export const ALERT_STATUS = {
  ACTIVE: "active",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export type AlertStatus = (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS];

// ============================================
// HELPERS
// ============================================

export function isValidUserRole(role: string): role is UserRole {
  return Object.values(USER_ROLE).includes(role as UserRole);
}

export function isValidPostStatus(status: string): status is PostStatus {
  return Object.values(POST_STATUS).includes(status as PostStatus);
}

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return Object.values(PAYMENT_STATUS).includes(status as PaymentStatus);
}

export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return Object.values(PAYMENT_METHOD).includes(method as PaymentMethod);
}

export function isValidNotificationType(
  type: string,
): type is NotificationType {
  return Object.values(NOTIFICATION_TYPE).includes(type as NotificationType);
}

export function isValidDriverStatus(status: string): status is DriverStatus {
  return Object.values(DRIVER_STATUS).includes(status as DriverStatus);
}

export function isValidVerificationStatus(
  status: string,
): status is VerificationStatus {
  return Object.values(VERIFICATION_STATUS).includes(
    status as VerificationStatus,
  );
}
