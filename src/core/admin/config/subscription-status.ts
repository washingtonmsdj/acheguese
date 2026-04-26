export const ADMIN_SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
} as const;

export type AdminSubscriptionStatus =
  (typeof ADMIN_SUBSCRIPTION_STATUS)[keyof typeof ADMIN_SUBSCRIPTION_STATUS];
