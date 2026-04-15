/**
 * Domínio interno: settlement_context
 *
 * Calcula breakdown financeiro e prepara contexto para o modo marketplace.
 * Não executa payout/split real nesta fase.
 */

import { DELIVERY_MODE, type DeliveryMode } from "../delivery/types";
import { PAYMENT_MODE, type PaymentMode } from "../payment-context/types";
import { roundMoney } from "../order/money";
import type {
  OrderFinancialBreakdown,
  SettlementContext,
  SettlementPreviewInput,
} from "./types";

export class SettlementContextService {
  static calculateFinancialBreakdown(
    input: SettlementPreviewInput,
  ): OrderFinancialBreakdown {
    const itemsTotal = roundMoney(input.items_total ?? 0, "items_total");
    const deliveryFee = roundMoney(input.delivery_fee ?? 0, "delivery_fee");
    const discountTotal = roundMoney(input.discount_total ?? 0, "discount_total");
    const orderTotal = roundMoney(
      itemsTotal + deliveryFee - discountTotal,
      "order_total",
    );

    if (itemsTotal < 0 || deliveryFee < 0 || discountTotal < 0 || orderTotal < 0) {
      throw new Error("Breakdown financeiro inválido: valores não podem ser negativos.");
    }

    const platformFee =
      input.platform_fee_amount !== undefined && input.platform_fee_amount !== null
        ? roundMoney(input.platform_fee_amount, "platform_fee_amount")
        : null;
    const courierAmount =
      input.courier_amount !== undefined && input.courier_amount !== null
        ? roundMoney(input.courier_amount, "courier_amount")
        : null;

    let merchantNet =
      input.merchant_net_amount !== undefined && input.merchant_net_amount !== null
        ? roundMoney(input.merchant_net_amount, "merchant_net_amount")
        : null;

    if (platformFee !== null && platformFee < 0) {
      throw new Error("Breakdown financeiro inválido: platform_fee_amount não pode ser negativo.");
    }

    if (courierAmount !== null && courierAmount < 0) {
      throw new Error("Breakdown financeiro inválido: courier_amount não pode ser negativo.");
    }

    if (merchantNet !== null && merchantNet < 0) {
      throw new Error("Breakdown financeiro inválido: merchant_net_amount não pode ser negativo.");
    }

    if (merchantNet === null && (platformFee !== null || courierAmount !== null)) {
      merchantNet = roundMoney(
        orderTotal - (platformFee ?? 0) - (courierAmount ?? 0),
        "merchant_net_amount",
      );
    }

    if (merchantNet !== null && merchantNet < 0) {
      throw new Error(
        "Breakdown financeiro inválido: merchant_net_amount calculado ficou negativo.",
      );
    }

    return {
      items_total: itemsTotal,
      delivery_fee: deliveryFee,
      discount_total: discountTotal,
      order_total: orderTotal,
      platform_fee_amount: platformFee,
      merchant_net_amount: merchantNet,
      courier_amount: courierAmount,
    };
  }

  static buildSettlementContext(params: {
    payment_mode: PaymentMode;
    delivery_mode: DeliveryMode;
    breakdown: OrderFinancialBreakdown;
    commercial_policy?: SettlementContext["commercial_policy"];
  }): SettlementContext {
    const { payment_mode, delivery_mode, breakdown, commercial_policy = null } = params;

    const settlementExecutionEnabled = false;
    const settlementReason =
      payment_mode === PAYMENT_MODE.DIRECT_TO_MERCHANT &&
      delivery_mode === DELIVERY_MODE.MERCHANT_OWN_FLEET
        ? "Modo atual: pagamento direto ao merchant e frota própria. Settlement apenas preparado."
        : "Modo marketplace preparado, mas execução de split/payout ainda não habilitada.";

    return {
      payment_mode,
      delivery_mode,
      breakdown,
      settlement_execution_enabled: settlementExecutionEnabled,
      settlement_reason: settlementReason,
      commercial_policy,
    };
  }

  static assertSettlementExecutionEnabled(): never {
    throw new Error(
      "Execução real de payout/split/settlement não está habilitada nesta fase.",
    );
  }
}
