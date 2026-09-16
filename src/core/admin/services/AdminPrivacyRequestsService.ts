import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

const ADMIN_PRIVACY_RPC_FUNCTION = "admin-privacy-rpc";

type AdminPrivacyAction = "listRequests" | "getRequest" | "transitionRequest";

export type PrivacyRequestStatus =
  | "received"
  | "in_review"
  | "waiting_for_requester"
  | "completed"
  | "denied"
  | "cancelled";

export type PrivacyRequestType =
  | "access"
  | "correction"
  | "anonymization"
  | "portability"
  | "deletion"
  | "information"
  | "consent_revocation"
  | "automated_decision"
  | "violation_report"
  | "other";

export type PrivacyRequestEventType =
  | "submitted"
  | "status_changed"
  | "backfilled_snapshot";

export interface AdminPrivacyRequestSummary {
  id: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  submitted_at: string;
  updated_at: string;
  resolved_at: string | null;
  linked_user: boolean;
}

export interface AdminPrivacyRequestHistoryEvent {
  event_type: PrivacyRequestEventType;
  from_status: PrivacyRequestStatus | null;
  to_status: PrivacyRequestStatus;
  occurred_at: string;
}

export interface AdminPrivacyRequestDetail {
  id: string;
  user_id: string | null;
  requester_name: string;
  requester_email: string;
  request_type: PrivacyRequestType;
  subject: string;
  message: string;
  status: PrivacyRequestStatus;
  submitted_at: string;
  updated_at: string;
  resolved_at: string | null;
  history: AdminPrivacyRequestHistoryEvent[];
}

export interface AdminPrivacyRequestListInput {
  status?: PrivacyRequestStatus | null;
  requestType?: PrivacyRequestType | null;
  page?: number;
  pageSize?: number;
}

export interface AdminPrivacyRequestListResult {
  items: AdminPrivacyRequestSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminPrivacyTransitionResult {
  id: string;
  status: PrivacyRequestStatus;
  updated_at: string;
  resolved_at: string | null;
}

async function invokeAdminPrivacy<T>(
  action: AdminPrivacyAction,
  params: Record<string, unknown>,
): Promise<T> {
  return invokeSupabaseBroker<T, AdminPrivacyAction>({
    action,
    functionName: ADMIN_PRIVACY_RPC_FUNCTION,
    params,
    serviceName: "AdminPrivacyRequestsService",
  });
}

async function listRequests(
  input: AdminPrivacyRequestListInput = {},
): Promise<AdminPrivacyRequestListResult> {
  return invokeAdminPrivacy<AdminPrivacyRequestListResult>("listRequests", {
    status: input.status ?? null,
    requestType: input.requestType ?? null,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 25,
  });
}

async function getRequest(requestId: string): Promise<AdminPrivacyRequestDetail> {
  return invokeAdminPrivacy<AdminPrivacyRequestDetail>("getRequest", { requestId });
}

async function transitionRequest(
  requestId: string,
  nextStatus: Exclude<PrivacyRequestStatus, "received">,
): Promise<AdminPrivacyTransitionResult> {
  return invokeAdminPrivacy<AdminPrivacyTransitionResult>("transitionRequest", {
    requestId,
    nextStatus,
  });
}

export const adminPrivacyRequestsService = {
  listRequests,
  getRequest,
  transitionRequest,
};

export type AdminPrivacyRequestsService = typeof adminPrivacyRequestsService;
