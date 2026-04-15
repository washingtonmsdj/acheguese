/**
 * Domínio interno: logistics
 *
 * State machine do status logístico (desacoplado do financeiro).
 */

import { LOGISTICS_STATUS, type LogisticsStatus } from "./types";

const ALLOWED_TRANSITIONS: Record<LogisticsStatus, LogisticsStatus[]> = {
  [LOGISTICS_STATUS.PENDING]: [
    LOGISTICS_STATUS.ACCEPTED,
    LOGISTICS_STATUS.CANCELED,
    LOGISTICS_STATUS.FAILED,
  ],
  [LOGISTICS_STATUS.ACCEPTED]: [
    LOGISTICS_STATUS.PREPARING,
    LOGISTICS_STATUS.CANCELED,
    LOGISTICS_STATUS.FAILED,
  ],
  [LOGISTICS_STATUS.PREPARING]: [
    LOGISTICS_STATUS.READY_FOR_PICKUP,
    LOGISTICS_STATUS.CANCELED,
    LOGISTICS_STATUS.FAILED,
  ],
  [LOGISTICS_STATUS.READY_FOR_PICKUP]: [
    LOGISTICS_STATUS.PICKED_UP,
    LOGISTICS_STATUS.CANCELED,
    LOGISTICS_STATUS.FAILED,
  ],
  [LOGISTICS_STATUS.PICKED_UP]: [
    LOGISTICS_STATUS.DELIVERED,
    LOGISTICS_STATUS.FAILED,
  ],
  [LOGISTICS_STATUS.DELIVERED]: [],
  [LOGISTICS_STATUS.CANCELED]: [],
  [LOGISTICS_STATUS.FAILED]: [],
};

const FINAL_STATES: LogisticsStatus[] = [
  LOGISTICS_STATUS.DELIVERED,
  LOGISTICS_STATUS.CANCELED,
  LOGISTICS_STATUS.FAILED,
];

export class OrderLogisticsStateMachine {
  static canTransition(from: LogisticsStatus, to: LogisticsStatus): boolean {
    if (from === to) return true;
    return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
  }

  static assertCanTransition(from: LogisticsStatus, to: LogisticsStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Transição logística inválida: ${from} -> ${to}. Permitidos: ${(ALLOWED_TRANSITIONS[from] ?? []).join(", ") || "nenhum"}`,
      );
    }
  }

  static isFinal(status: LogisticsStatus): boolean {
    return FINAL_STATES.includes(status);
  }

  static getNextStatuses(status: LogisticsStatus): LogisticsStatus[] {
    return ALLOWED_TRANSITIONS[status] ?? [];
  }
}
