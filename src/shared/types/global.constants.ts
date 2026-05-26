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
// RIDE STATUS - MOVED TO @/shared/types/mobility.constants
// ============================================
// NOTA: RIDE_STATUS agora e mantido em @/shared/types/mobility.constants
// para evitar duplicação. Use:
// import { RIDE_STATUS } from '@/shared/types/mobility.constants'
// ou
// import { RIDE_STATUS } from '@/shared/types/constants'

// ============================================
// BUSINESS STATUS
// ============================================

export const BUSINESS_STATUS = {
  ACTIVE: "ativo",
  INACTIVE: "inativo",
  PENDING: "pendente",
  SUSPENDED: "suspenso",
} as const;

export type BusinessStatus =
  (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

// Labels de Status de Empresas
export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  [BUSINESS_STATUS.ACTIVE]: "Ativo",
  [BUSINESS_STATUS.INACTIVE]: "Inativo",
  [BUSINESS_STATUS.PENDING]: "Pendente",
  [BUSINESS_STATUS.SUSPENDED]: "Suspenso",
};

// ============================================
// ALERT STATUS
// ============================================

export const ALERT_STATUS = {
  ACTIVE: "active",
  RESOLVED: "resolved",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  DISMISSED: "dismissed",
} as const;

export type AlertStatus = (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS];

// Labels de Status de Alertas
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  [ALERT_STATUS.ACTIVE]: "Ativo",
  [ALERT_STATUS.RESOLVED]: "Resolvido",
  [ALERT_STATUS.EXPIRED]: "Expirado",
  [ALERT_STATUS.CANCELLED]: "Cancelado",
  [ALERT_STATUS.DISMISSED]: "Descartado",
};

// Cores de Status de Alertas
export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  [ALERT_STATUS.ACTIVE]: "#EF4444", // red-500
  [ALERT_STATUS.RESOLVED]: "#10B981", // green-500
  [ALERT_STATUS.EXPIRED]: "#6B7280", // gray-500
  [ALERT_STATUS.CANCELLED]: "#9CA3AF", // gray-400
  [ALERT_STATUS.DISMISSED]: "#9CA3AF", // gray-400
};

// ============================================
// REPORT STATUS
// ============================================

export const REPORT_STATUS = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  INVESTIGATING: "investigating",
  REVIEWED: "reviewed",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

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

export function isValidReportStatus(status: string): status is ReportStatus {
  return Object.values(REPORT_STATUS).includes(status as ReportStatus);
}

export function isValidAlertStatus(status: string): status is AlertStatus {
  return Object.values(ALERT_STATUS).includes(status as AlertStatus);
}

// isValidRideStatus movido para @/shared/types/mobility.constants

export function isValidBusinessStatus(
  status: string,
): status is BusinessStatus {
  return Object.values(BUSINESS_STATUS).includes(status as BusinessStatus);
}
