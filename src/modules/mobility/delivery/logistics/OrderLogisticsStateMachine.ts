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

function getAllowedTransitions(status: LogisticsStatus): LogisticsStatus[] {
  switch (status) {
    case LOGISTICS_STATUS.PENDING:
      return ALLOWED_TRANSITIONS.pending;
    case LOGISTICS_STATUS.ACCEPTED:
      return ALLOWED_TRANSITIONS.accepted;
    case LOGISTICS_STATUS.PREPARING:
      return ALLOWED_TRANSITIONS.preparing;
    case LOGISTICS_STATUS.READY_FOR_PICKUP:
      return ALLOWED_TRANSITIONS.ready_for_pickup;
    case LOGISTICS_STATUS.PICKED_UP:
      return ALLOWED_TRANSITIONS.picked_up;
    case LOGISTICS_STATUS.DELIVERED:
      return ALLOWED_TRANSITIONS.delivered;
    case LOGISTICS_STATUS.CANCELED:
      return ALLOWED_TRANSITIONS.canceled;
    case LOGISTICS_STATUS.FAILED:
      return ALLOWED_TRANSITIONS.failed;
    default:
      return [];
  }
}

export class OrderLogisticsStateMachine {
  static canTransition(from: LogisticsStatus, to: LogisticsStatus): boolean {
    if (from === to) return true;
    return getAllowedTransitions(from).includes(to);
  }

  static assertCanTransition(from: LogisticsStatus, to: LogisticsStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Transição logística inválida: ${from} -> ${to}. Permitidos: ${getAllowedTransitions(from).join(", ") || "nenhum"}`,
      );
    }
  }

  static isFinal(status: LogisticsStatus): boolean {
    return FINAL_STATES.includes(status);
  }

  static getNextStatuses(status: LogisticsStatus): LogisticsStatus[] {
    return getAllowedTransitions(status);
  }
}
