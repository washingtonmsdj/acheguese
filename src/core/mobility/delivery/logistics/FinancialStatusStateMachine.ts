import { FINANCIAL_STATUS, type FinancialStatus } from "../payment-context/types";

const ALLOWED_TRANSITIONS: Record<FinancialStatus, FinancialStatus[]> = {
  [FINANCIAL_STATUS.NOT_APPLICABLE]: [
    FINANCIAL_STATUS.PENDING_PAYMENT,
    FINANCIAL_STATUS.PAID,
  ],
  [FINANCIAL_STATUS.PENDING_PAYMENT]: [
    FINANCIAL_STATUS.PAID,
    FINANCIAL_STATUS.REFUNDED,
    FINANCIAL_STATUS.PARTIALLY_REFUNDED,
  ],
  [FINANCIAL_STATUS.PAID]: [
    FINANCIAL_STATUS.REFUNDED,
    FINANCIAL_STATUS.PARTIALLY_REFUNDED,
    FINANCIAL_STATUS.PAYOUT_PENDING,
  ],
  [FINANCIAL_STATUS.REFUNDED]: [],
  [FINANCIAL_STATUS.PARTIALLY_REFUNDED]: [
    FINANCIAL_STATUS.REFUNDED,
    FINANCIAL_STATUS.PAYOUT_PENDING,
  ],
  [FINANCIAL_STATUS.PAYOUT_PENDING]: [
    FINANCIAL_STATUS.PAYOUT_SENT,
    FINANCIAL_STATUS.PAYOUT_FAILED,
  ],
  [FINANCIAL_STATUS.PAYOUT_SENT]: [],
  [FINANCIAL_STATUS.PAYOUT_FAILED]: [
    FINANCIAL_STATUS.PAYOUT_PENDING,
  ],
};

const FINAL_STATUSES: FinancialStatus[] = [
  FINANCIAL_STATUS.REFUNDED,
  FINANCIAL_STATUS.PAYOUT_SENT,
];

function getAllowedTransitions(status: FinancialStatus): FinancialStatus[] {
  switch (status) {
    case FINANCIAL_STATUS.NOT_APPLICABLE:
      return ALLOWED_TRANSITIONS.not_applicable;
    case FINANCIAL_STATUS.PENDING_PAYMENT:
      return ALLOWED_TRANSITIONS.pending_payment;
    case FINANCIAL_STATUS.PAID:
      return ALLOWED_TRANSITIONS.paid;
    case FINANCIAL_STATUS.REFUNDED:
      return ALLOWED_TRANSITIONS.refunded;
    case FINANCIAL_STATUS.PARTIALLY_REFUNDED:
      return ALLOWED_TRANSITIONS.partially_refunded;
    case FINANCIAL_STATUS.PAYOUT_PENDING:
      return ALLOWED_TRANSITIONS.payout_pending;
    case FINANCIAL_STATUS.PAYOUT_SENT:
      return ALLOWED_TRANSITIONS.payout_sent;
    case FINANCIAL_STATUS.PAYOUT_FAILED:
      return ALLOWED_TRANSITIONS.payout_failed;
    default:
      return [];
  }
}

export class FinancialStatusStateMachine {
  static canTransition(from: FinancialStatus, to: FinancialStatus): boolean {
    if (from === to) return true;
    return getAllowedTransitions(from).includes(to);
  }

  static assertCanTransition(from: FinancialStatus, to: FinancialStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Transicao financeira invalida: ${from} -> ${to}. Permitidos: ${getAllowedTransitions(from).join(", ") || "nenhum"}`,
      );
    }
  }

  static isFinal(status: FinancialStatus): boolean {
    return FINAL_STATUSES.includes(status);
  }

  static getNextStatuses(status: FinancialStatus): FinancialStatus[] {
    return getAllowedTransitions(status);
  }
}
