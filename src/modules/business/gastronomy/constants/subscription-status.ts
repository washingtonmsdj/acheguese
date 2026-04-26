export const GASTRONOMY_SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  TRIALING: "trialing",
} as const;

export type GastronomySubscriptionStatus =
  (typeof GASTRONOMY_SUBSCRIPTION_STATUSES)[keyof typeof GASTRONOMY_SUBSCRIPTION_STATUSES];
