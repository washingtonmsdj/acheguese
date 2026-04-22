/**
 * Query keys canônicas do módulo vertical de delivery.
 */

export const DELIVERY_QUERY_KEYS = {
  order: (orderId: string) => ["delivery", "order", orderId] as const,
  orderTimeline: (orderId: string) =>
    ["delivery", "order", orderId, "timeline"] as const,
  orderIncidents: (orderId: string) =>
    ["delivery", "order", orderId, "incidents"] as const,
} as const;
