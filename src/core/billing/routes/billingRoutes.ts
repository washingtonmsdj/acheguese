export const BILLING_PATHS = {
  pricing: "/planos",
  checkoutSuccess: "/checkout/success",
  checkoutCancel: "/checkout/cancel",
  subscription: "/settings/subscription",
} as const;

export type BillingPathKey = keyof typeof BILLING_PATHS;
