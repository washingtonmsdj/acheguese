export const TERRITORY_NODE_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

export type TerritoryNodeStatus =
  (typeof TERRITORY_NODE_STATUSES)[keyof typeof TERRITORY_NODE_STATUSES];
