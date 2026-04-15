/**
 * Domínio interno: payment_context
 */

export const PAYMENT_MODE = {
  DIRECT_TO_MERCHANT: "direct_to_merchant",
  PLATFORM_CHECKOUT: "platform_checkout",
} as const;

export type PaymentMode = (typeof PAYMENT_MODE)[keyof typeof PAYMENT_MODE];

export const FINANCIAL_STATUS = {
  NOT_APPLICABLE: "not_applicable",
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
  PAYOUT_PENDING: "payout_pending",
  PAYOUT_SENT: "payout_sent",
  PAYOUT_FAILED: "payout_failed",
} as const;

export type FinancialStatus =
  (typeof FINANCIAL_STATUS)[keyof typeof FINANCIAL_STATUS];

export interface PaymentContext {
  payment_mode: PaymentMode;
  financial_status: FinancialStatus;
  payment_method?: string | null;
  external_payment_reference?: string | null;
  paid_at?: string | null;
  refunded_at?: string | null;
}

export interface UpdateFinancialStatusInput {
  financial_status: FinancialStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}
