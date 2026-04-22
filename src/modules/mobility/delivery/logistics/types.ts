/**
 * Domínio interno: logistics
 *
 * Status logístico desacoplado do financeiro.
 */

export const LOGISTICS_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PREPARING: "preparing",
  READY_FOR_PICKUP: "ready_for_pickup",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered",
  CANCELED: "canceled",
  FAILED: "failed",
} as const;

export type LogisticsStatus =
  (typeof LOGISTICS_STATUS)[keyof typeof LOGISTICS_STATUS];
