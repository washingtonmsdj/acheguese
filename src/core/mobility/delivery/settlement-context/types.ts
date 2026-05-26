/**
 * Internal domain: settlement context.
 */

import type { DeliveryMode } from "../delivery/types";
import type { PaymentMode } from "../payment-context/types";

export interface OrderFinancialBreakdown {
  items_total: number;
  delivery_fee: number;
  discount_total: number;
  order_total: number;
  platform_fee_amount?: number | null;
  merchant_net_amount?: number | null;
  courier_amount?: number | null;
}

export interface MerchantSubscriptionPolicySnapshot {
  plan_code: string;
  billing_model: "monthly";
  monthly_fee_amount: number;
}

export interface CourierSubscriptionPolicySnapshot {
  plan_code: string;
  billing_model: "monthly";
  monthly_fee_amount: number;
}

export interface PlatformCommissionPolicySnapshot {
  trigger: "order_completed";
  calculation_type: "fixed" | "percentage";
  amount?: number | null;
  rate?: number | null;
}

export interface PlatformFeePolicySnapshot {
  calculation_type: "fixed" | "percentage" | "hybrid";
  fixed_amount?: number | null;
  rate?: number | null;
}

export interface SettlementCommercialPolicySnapshot {
  merchant_subscription?: MerchantSubscriptionPolicySnapshot | null;
  courier_subscription?: CourierSubscriptionPolicySnapshot | null;
  platform_commission?: PlatformCommissionPolicySnapshot | null;
  platform_fee?: PlatformFeePolicySnapshot | null;
}

export interface SettlementContext {
  payment_mode: PaymentMode;
  delivery_mode: DeliveryMode;
  breakdown: OrderFinancialBreakdown;
  settlement_execution_enabled: boolean;
  settlement_reason: string;
  commercial_policy?: SettlementCommercialPolicySnapshot | null;
}

export interface SettlementPreviewInput {
  items_total: number;
  delivery_fee?: number;
  discount_total?: number;
  platform_fee_amount?: number | null;
  merchant_net_amount?: number | null;
  courier_amount?: number | null;
}
