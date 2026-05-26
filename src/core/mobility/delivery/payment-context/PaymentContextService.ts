import { FinancialStatusStateMachine } from "../logistics/FinancialStatusStateMachine";
import {
  FINANCIAL_STATUS,
  PAYMENT_MODE,
  type FinancialStatus,
  type PaymentMode,
} from "./types";

export class PaymentContextService {
  static assertCurrentPaymentModeSupported(paymentMode: PaymentMode): void {
    if (paymentMode !== PAYMENT_MODE.DIRECT_TO_MERCHANT) {
      throw new Error(
        `payment_mode=${paymentMode} preparado no SSOT, mas nao esta ativo nesta fase operacional.`,
      );
    }
  }

  static assertSettlementExecutionNotEnabled(paymentMode: PaymentMode): void {
    if (paymentMode === PAYMENT_MODE.PLATFORM_CHECKOUT) {
      throw new Error(
        "Execucao real de checkout/split/payout ainda nao esta habilitada.",
      );
    }
  }

  static resolveInitialFinancialStatus(
    paymentMode: PaymentMode,
    requestedStatus?: FinancialStatus,
  ): FinancialStatus {
    if (requestedStatus) return requestedStatus;

    if (paymentMode === PAYMENT_MODE.DIRECT_TO_MERCHANT) {
      return FINANCIAL_STATUS.NOT_APPLICABLE;
    }

    return FINANCIAL_STATUS.PENDING_PAYMENT;
  }

  static assertFinancialTransition(
    from: FinancialStatus,
    to: FinancialStatus,
  ): void {
    FinancialStatusStateMachine.assertCanTransition(from, to);
  }
}
