/**
 * Domínio interno: logistics
 *
 * State machine do status financeiro desacoplado da logística.
 */

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

export class FinancialStatusStateMachine {
  static canTransition(from: FinancialStatus, to: FinancialStatus): boolean {
    if (from === to) return true;
    return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
  }

  static assertCanTransition(from: FinancialStatus, to: FinancialStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Transição financeira inválida: ${from} -> ${to}. Permitidos: ${(ALLOWED_TRANSITIONS[from] ?? []).join(", ") || "nenhum"}`,
      );
    }
  }

  static isFinal(status: FinancialStatus): boolean {
    return FINAL_STATUSES.includes(status);
  }

  static getNextStatuses(status: FinancialStatus): FinancialStatus[] {
    return ALLOWED_TRANSITIONS[status] ?? [];
  }
}
