import type { RequestStatus } from "../types";

export const COMMUNICATION_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const satisfies Record<string, RequestStatus>;
