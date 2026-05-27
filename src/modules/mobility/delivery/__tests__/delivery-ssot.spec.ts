import { describe, expect, it } from "vitest";

import {
  DELIVERY_MODE,
  FINANCIAL_STATUS,
  FinancialStatusStateMachine,
  LOGISTICS_STATUS,
  OrderLogisticsStateMachine,
  PAYMENT_MODE,
  PaymentContextService,
  SettlementContextService,
} from "@/modules/mobility/delivery";

describe("Delivery module SSOT", () => {
  it("mantem transicoes logisticas validas do fluxo atual", () => {
    expect(
      OrderLogisticsStateMachine.canTransition(
        LOGISTICS_STATUS.PENDING,
        LOGISTICS_STATUS.ACCEPTED,
      ),
    ).toBe(true);

    expect(
      OrderLogisticsStateMachine.canTransition(
        LOGISTICS_STATUS.ACCEPTED,
        LOGISTICS_STATUS.PREPARING,
      ),
    ).toBe(true);

    expect(
      OrderLogisticsStateMachine.canTransition(
        LOGISTICS_STATUS.PREPARING,
        LOGISTICS_STATUS.READY_FOR_PICKUP,
      ),
    ).toBe(true);

    expect(
      OrderLogisticsStateMachine.canTransition(
        LOGISTICS_STATUS.READY_FOR_PICKUP,
        LOGISTICS_STATUS.PICKED_UP,
      ),
    ).toBe(true);

    expect(
      OrderLogisticsStateMachine.canTransition(
        LOGISTICS_STATUS.PICKED_UP,
        LOGISTICS_STATUS.DELIVERED,
      ),
    ).toBe(true);
  });

  it("bloqueia transicao logistica invalida", () => {
    expect(() =>
      OrderLogisticsStateMachine.assertCanTransition(
        LOGISTICS_STATUS.PENDING,
        LOGISTICS_STATUS.DELIVERED,
      ),
    ).toThrow(/inv[aá]lida/i);
  });

  it("mantem transicoes financeiras separadas da logistica", () => {
    expect(
      FinancialStatusStateMachine.canTransition(
        FINANCIAL_STATUS.PENDING_PAYMENT,
        FINANCIAL_STATUS.PAID,
      ),
    ).toBe(true);

    expect(
      FinancialStatusStateMachine.canTransition(
        FINANCIAL_STATUS.PAID,
        FINANCIAL_STATUS.REFUNDED,
      ),
    ).toBe(true);

    expect(
      FinancialStatusStateMachine.canTransition(
        FINANCIAL_STATUS.PAID,
        FINANCIAL_STATUS.PENDING_PAYMENT,
      ),
    ).toBe(false);
  });

  it("aceita apenas payment_mode ativo na fase atual", () => {
    expect(() =>
      PaymentContextService.assertCurrentPaymentModeSupported(
        PAYMENT_MODE.DIRECT_TO_MERCHANT,
      ),
    ).not.toThrow();

    expect(() =>
      PaymentContextService.assertCurrentPaymentModeSupported(
        PAYMENT_MODE.PLATFORM_CHECKOUT,
      ),
    ).toThrow(/ativo/i);
  });

  it("calcula breakdown financeiro desacoplado", () => {
    const breakdown = SettlementContextService.calculateFinancialBreakdown({
      items_total: 120,
      delivery_fee: 10,
      discount_total: 5,
      platform_fee_amount: 8,
      courier_amount: 12,
    });

    expect(breakdown.items_total).toBe(120);
    expect(breakdown.delivery_fee).toBe(10);
    expect(breakdown.discount_total).toBe(5);
    expect(breakdown.order_total).toBe(125);
    expect(breakdown.platform_fee_amount).toBe(8);
    expect(breakdown.courier_amount).toBe(12);
    expect(breakdown.merchant_net_amount).toBe(105);
  });

  it("rejeita breakdown que geraria merchant_net_amount negativo", () => {
    expect(() =>
      SettlementContextService.calculateFinancialBreakdown({
        items_total: 10,
        delivery_fee: 0,
        discount_total: 0,
        platform_fee_amount: 8,
        courier_amount: 5,
      }),
    ).toThrow(/merchant_net_amount/i);
  });

  it("prepara settlement_context para modo futuro sem ativar execucao", () => {
    const breakdown = SettlementContextService.calculateFinancialBreakdown({
      items_total: 50,
      delivery_fee: 7,
      discount_total: 2,
    });

    const context = SettlementContextService.buildSettlementContext({
      payment_mode: PAYMENT_MODE.DIRECT_TO_MERCHANT,
      delivery_mode: DELIVERY_MODE.MERCHANT_OWN_FLEET,
      breakdown,
    });

    expect(context.settlement_execution_enabled).toBe(false);
    expect(context.breakdown.order_total).toBe(55);
  });
});
