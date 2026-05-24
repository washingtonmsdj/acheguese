import type { WorkOpportunityStatus } from "../types";

export const WORK_OPPORTUNITY_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  FILLED: "filled",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const satisfies Record<string, WorkOpportunityStatus>;
